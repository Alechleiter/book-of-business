#!/usr/bin/env python3
"""
Import CA Multi-Family data into Supabase.

Usage:
  1. pip install supabase python-dotenv
  2. Create .env file with:
       SUPABASE_URL=https://your-project.supabase.co
       SUPABASE_KEY=your-anon-key
  3. python scripts/import_data.py path/to/California_Properties_5plus_units.csv

This script:
  - Deduplicates the data (removes ~160 duplicate rows)
  - Inserts all properties into the properties table
  - Computes and inserts zip aggregates
  - Takes about 2-3 minutes for 38K rows
"""

import csv
import re
import sys
import os
from collections import defaultdict

try:
    from supabase import create_client
    from dotenv import load_dotenv
except ImportError:
    print("Install dependencies: pip install supabase python-dotenv")
    sys.exit(1)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_KEY in .env file")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def normalize_addr(a):
    a = a.lower().strip().rstrip(",").rstrip(".")
    a = re.sub(r"\s+", " ", a)
    a = a.replace(" blvd.", " blvd").replace(" st.", " st").replace(" ave.", " ave")
    a = a.replace(" dr.", " dr").replace(" rd.", " rd").replace(" ct.", " ct")
    a = re.sub(r"[.,#]", "", a)
    return a


def safe_int(v, default=0):
    try:
        return int(v)
    except (ValueError, TypeError):
        return default


def safe_float(v, default=0.0):
    try:
        return float(v)
    except (ValueError, TypeError):
        return default


def dedup_rows(rows):
    """Remove duplicate properties (same address+zip+units or same name+zip+units)"""
    addr_groups = defaultdict(list)
    name_groups = defaultdict(list)

    for i, row in enumerate(rows):
        z = row.get("ZIP", "").strip()[:5]
        addr = normalize_addr(row.get("Address", ""))
        name = row.get("Name", "").strip().lower()
        units = row.get("Units", "0")

        if addr and z:
            addr_groups[(addr, z, units)].append(i)
        if name and z:
            name_groups[(name, z, units)].append(i)

    remove = set()

    def score(idx):
        r = rows[idx]
        s = 0
        if r.get("Status", "").strip() == "active":
            s += 100
        if r.get("Management Company", "").strip():
            s += 10
        if r.get("Avg Rent", "0") not in ("0", ""):
            s += 5
        if r.get("Occ %", "0") not in ("0", ""):
            s += 5
        return s

    for groups in [addr_groups, name_groups]:
        for key, indices in groups.items():
            if len(indices) <= 1:
                continue
            live = [i for i in indices if i not in remove]
            if len(live) <= 1:
                continue
            sorted_idx = sorted(live, key=score, reverse=True)
            for idx in sorted_idx[1:]:
                remove.add(idx)

    return remove


def main():
    if len(sys.argv) < 2:
        print("Usage: python import_data.py <csv_file>")
        sys.exit(1)

    csv_path = sys.argv[1]
    print(f"Reading {csv_path}...")

    rows = []
    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"Total rows: {len(rows)}")

    # Deduplicate
    remove = dedup_rows(rows)
    print(f"Removing {len(remove)} duplicates...")

    # Build property records
    properties = []
    for i, row in enumerate(rows):
        if i in remove:
            continue

        z = row.get("ZIP", "").strip()[:5]
        if not z or len(z) < 5:
            continue

        concessions = row.get("Specials / Concessions", "").strip()

        properties.append({
            "source_id": row.get("ID", "").strip(),
            "name": row.get("Name", "").strip(),
            "former_name": row.get("Former Name", "").strip() or None,
            "address": row.get("Address", "").strip(),
            "city": row.get("City", "").strip(),
            "zip": z,
            "county": row.get("County", "").strip() or None,
            "market": row.get("Market", "").strip() or None,
            "submarket": row.get("Submarket", "").strip() or None,
            "neighborhood": row.get("Neighborhood", "").strip() or None,
            "management_company": row.get("Management Company", "").strip() or None,
            "onsite_manager": row.get("Onsite Manager", "").strip() or None,
            "regional_supervisor": row.get("Regional Supervisor", "").strip() or None,
            "phone": row.get("Phone", "").strip() or None,
            "email": row.get("Email", "").strip() or None,
            "onsite_manager_email": row.get("Onsite Manager Email", "").strip() or None,
            "regional_supervisor_email": row.get("Regional Supervisor Email", "").strip() or None,
            "url": row.get("URL", "").strip() or None,
            "units": safe_int(row.get("Units")),
            "stories": safe_int(row.get("Stories")),
            "built_type": row.get("Built Type", "").strip() or None,
            "year_built": safe_int(row.get("Built")) or None,
            "year_renovated": safe_int(row.get("Renov")) or None,
            "classification": row.get("Classification", "").strip() or None,
            "housing_type": row.get("Housing Type", "").strip() or None,
            "software_system": row.get("Software System", "").strip() or None,
            "ownership": row.get("Ownership", "").strip() or None,
            "avg_rent": safe_float(row.get("Avg Rent")),
            "avg_eff_rent": safe_float(row.get("Avg Eff Rent")),
            "avg_sqft": safe_float(row.get("Avg Sqft")),
            "avg_price_per_sqft": safe_float(row.get("Avg $/Sqft")),
            "total_rentable_sqft": safe_int(row.get("Total Rentable Sqft")),
            "occupancy": safe_float(row.get("Occ %")),
            "min_lease_term": safe_int(row.get("Min Lease Term")),
            "status": row.get("Status", "").strip() or "active",
            "has_concessions": bool(concessions),
            "concessions_text": concessions or None,
        })

    print(f"Properties after dedup: {len(properties)}")

    # Insert in batches of 500
    print("Inserting properties...")
    batch_size = 500
    for i in range(0, len(properties), batch_size):
        batch = properties[i : i + batch_size]
        supabase.table("properties").insert(batch).execute()
        print(f"  Inserted {min(i + batch_size, len(properties))}/{len(properties)}")

    print("Properties done!")

    # Compute zip aggregates
    # We need zip coordinates - install zipcodes package
    try:
        import zipcodes as zc
    except ImportError:
        print("WARNING: pip install zipcodes for lat/lng data")
        zc = None

    print("Computing zip aggregates...")
    zip_data = defaultdict(lambda: {
        "units": 0, "props": 0, "active": 0,
        "rent_sum": 0, "rent_count": 0,
        "occ_sum": 0, "occ_count": 0,
        "city": "", "county": "", "market": ""
    })

    for p in properties:
        z = p["zip"]
        zip_data[z]["units"] += p["units"]
        zip_data[z]["props"] += 1
        if p["status"] == "active":
            zip_data[z]["active"] += 1
        if p["avg_rent"] and p["avg_rent"] > 0:
            zip_data[z]["rent_sum"] += p["avg_rent"]
            zip_data[z]["rent_count"] += 1
        if p["occupancy"] and p["occupancy"] > 0:
            zip_data[z]["occ_sum"] += p["occupancy"]
            zip_data[z]["occ_count"] += 1
        if not zip_data[z]["city"]:
            zip_data[z]["city"] = p["city"]
            zip_data[z]["county"] = p.get("county", "")
            zip_data[z]["market"] = p.get("market", "")

    zip_records = []
    for z, d in zip_data.items():
        lat, lng = None, None
        if zc:
            results = zc.matching(z)
            if results and results[0].get("lat"):
                lat = float(results[0]["lat"])
                lng = float(results[0]["long"])

        zip_records.append({
            "zip": z,
            "city": d["city"],
            "county": d["county"],
            "market": d["market"],
            "total_units": d["units"],
            "total_properties": d["props"],
            "active_properties": d["active"],
            "avg_rent": round(d["rent_sum"] / d["rent_count"], 2) if d["rent_count"] > 0 else 0,
            "avg_occupancy": round(d["occ_sum"] / d["occ_count"], 2) if d["occ_count"] > 0 else 0,
            "lat": lat,
            "lng": lng,
        })

    # Insert zip aggregates
    print(f"Inserting {len(zip_records)} zip aggregates...")
    for i in range(0, len(zip_records), 500):
        batch = zip_records[i : i + 500]
        supabase.table("zip_aggregates").insert(batch).execute()

    print(f"\nDone! Imported {len(properties)} properties across {len(zip_records)} zip codes.")


if __name__ == "__main__":
    main()

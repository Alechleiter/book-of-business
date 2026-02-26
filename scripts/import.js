const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ltokrnrhjdaykyprqujh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b2tybnJoamRheWt5cHJxdWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzA1OTYsImV4cCI6MjA4NzYwNjU5Nn0.iY1Wj7h72N_Pu9907xhfuBYmUb4c3mLI-7GwZ4RXCqw';
const XLSX_PATH = 'C:/Users/albea/Downloads/California_Properties_5plus_units_cleaned.xlsx';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function safeStr(v) {
  if (v === null || v === undefined || v === '') return null;
  return String(v).trim() || null;
}

function safeInt(v) {
  const n = parseInt(v);
  return isNaN(n) ? 0 : n;
}

function safeFloat(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function normalizeAddr(a) {
  if (!a) return '';
  return String(a).toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,#]/g, '')
    .replace(/ blvd\.?/g, ' blvd')
    .replace(/ st\.?/g, ' st')
    .replace(/ ave\.?/g, ' ave')
    .replace(/ dr\.?/g, ' dr')
    .replace(/ rd\.?/g, ' rd');
}

function scorePriority(row) {
  let s = 0;
  if (String(row['Status'] || '').toLowerCase() === 'active') s += 100;
  if (row['Management Company']) s += 10;
  if (row['Avg Rent'] && row['Avg Rent'] > 0) s += 5;
  if (row['Occ %'] && row['Occ %'] > 0) s += 5;
  return s;
}

async function main() {
  console.log('Reading Excel file...');
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
  console.log('Total rows:', rows.length);

  // Deduplicate
  const seen = new Map();
  for (const row of rows) {
    const z = String(row['ZIP'] || '').trim().slice(0, 5);
    const addr = normalizeAddr(row['Address']);
    const units = safeInt(row['Units']);
    const key = `${addr}|${z}|${units}`;

    if (!z || z.length < 5) continue;

    const existing = seen.get(key);
    if (!existing || scorePriority(row) > scorePriority(existing)) {
      seen.set(key, row);
    }
  }

  const deduped = Array.from(seen.values());
  console.log('After dedup:', deduped.length);

  // Transform to DB format
  const properties = deduped.map(row => {
    const concessions = safeStr(row['Specials / Concessions']);
    const phone = row['Phone'] ? String(row['Phone']).trim() : null;
    return {
      source_id: safeStr(row['ID']),
      name: String(row['Name'] || '').trim(),
      former_name: safeStr(row['Former Name']),
      address: safeStr(row['Address']),
      city: safeStr(row['City']),
      zip: String(row['ZIP'] || '').trim().slice(0, 5),
      county: safeStr(row['County']),
      state: safeStr(row['State']) || 'CA',
      market: safeStr(row['Market']),
      submarket: safeStr(row['Submarket']),
      neighborhood: safeStr(row['Neighborhood']),
      management_company: safeStr(row['Management Company']),
      onsite_manager: safeStr(row['Onsite Manager']),
      regional_supervisor: safeStr(row['Regional Supervisor']),
      phone: phone,
      email: safeStr(row['Email']),
      onsite_manager_email: safeStr(row['Onsite Manager Email']),
      regional_supervisor_email: safeStr(row['Regional Supervisor Email']),
      url: safeStr(row['URL']),
      units: safeInt(row['Units']),
      stories: safeInt(row['Stories']),
      built_type: safeStr(row['Built Type']),
      year_built: safeInt(row['Built']) || null,
      year_renovated: safeInt(row['Renov']) || null,
      classification: safeStr(row['Classification']),
      housing_type: safeStr(row['Housing Type']),
      software_system: safeStr(row['Software System']),
      ownership: safeStr(row['Ownership']),
      flat_fee: safeStr(row['Flat Fee']),
      avg_rent: safeFloat(row['Avg Rent']),
      avg_eff_rent: safeFloat(row['Avg Eff Rent']),
      avg_sqft: safeFloat(row['Avg Sqft']),
      avg_price_per_sqft: safeFloat(row['Avg $/Sqft']),
      avg_eff_price_per_sqft: safeFloat(row['Avg Eff $/Sqft']),
      total_rentable_sqft: safeInt(row['Total Rentable Sqft']),
      occupancy: safeFloat(row['Occ %']),
      min_lease_term: safeInt(row['Min Lease Term']),
      status: String(row['Status'] || 'active').trim().toLowerCase(),
      has_concessions: Boolean(concessions),
      concessions_text: concessions,
      former_management_company: safeStr(row['Former Management Company']),
      former_onsite_manager: safeStr(row['Former Onsite Manager']),
      former_supervisor: safeStr(row['Former Supervisor']),
    };
  });

  console.log('Inserting', properties.length, 'properties...');

  const BATCH = 500;
  for (let i = 0; i < properties.length; i += BATCH) {
    const batch = properties.slice(i, i + BATCH);
    const { error } = await sb.from('properties').insert(batch);
    if (error) {
      console.error('Error at batch', Math.floor(i / BATCH), ':', error.message);
      // Try smaller batches on error
      for (const row of batch) {
        const { error: e2 } = await sb.from('properties').insert(row);
        if (e2) console.error('  Skip row:', row.name, '-', e2.message);
      }
    }
    const done = Math.min(i + BATCH, properties.length);
    console.log(`  ${done}/${properties.length} (${Math.round(done/properties.length*100)}%)`);
  }

  // Compute zip aggregates
  console.log('Computing zip aggregates...');
  const zipMap = {};
  for (const p of properties) {
    const z = p.zip;
    if (!zipMap[z]) {
      zipMap[z] = { units: 0, props: 0, active: 0, rentSum: 0, rentCount: 0, occSum: 0, occCount: 0, city: '', county: '', market: '' };
    }
    const d = zipMap[z];
    d.units += p.units;
    d.props += 1;
    if (p.status === 'active') d.active += 1;
    if (p.avg_rent > 0) { d.rentSum += p.avg_rent; d.rentCount += 1; }
    if (p.occupancy > 0) { d.occSum += p.occupancy; d.occCount += 1; }
    if (!d.city && p.city) { d.city = p.city; d.county = p.county || ''; d.market = p.market || ''; }
  }

  const zipRecords = Object.entries(zipMap).map(([zip, d]) => ({
    zip,
    city: d.city,
    county: d.county,
    market: d.market,
    total_units: d.units,
    total_properties: d.props,
    active_properties: d.active,
    avg_rent: d.rentCount > 0 ? Math.round(d.rentSum / d.rentCount * 100) / 100 : 0,
    avg_occupancy: d.occCount > 0 ? Math.round(d.occSum / d.occCount * 100) / 100 : 0,
  }));

  console.log('Inserting', zipRecords.length, 'zip aggregates...');
  for (let i = 0; i < zipRecords.length; i += 500) {
    const batch = zipRecords.slice(i, i + 500);
    const { error } = await sb.from('zip_aggregates').insert(batch);
    if (error) console.error('Zip error:', error.message);
  }

  // Final check
  const { count: pCount } = await sb.from('properties').select('*', { count: 'exact', head: true });
  const { count: zCount } = await sb.from('zip_aggregates').select('*', { count: 'exact', head: true });
  console.log('\nDONE!');
  console.log('Properties:', pCount);
  console.log('Zip codes:', zCount);
}

main().catch(e => console.error('Fatal:', e));

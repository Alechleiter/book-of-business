'use client';

import { useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { ZipAggregate, Property } from '@/types/database';

const CHUNK_SIZE = 50;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface BulkSummary {
  matchedZipCount: number;
  totalProperties: number;
  totalUnits: number;
  avgRent: number;
  avgOccupancy: number;
  unmatchedZips: string[];
}

const EMPTY_SUMMARY: BulkSummary = {
  matchedZipCount: 0,
  totalProperties: 0,
  totalUnits: 0,
  avgRent: 0,
  avgOccupancy: 0,
  unmatchedZips: [],
};

export function useBulkZips() {
  const [zips, setZips] = useState<ZipAggregate[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [summary, setSummary] = useState<BulkSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (rawInput: string) => {
    // Parse: split on commas, newlines, spaces, tabs, semicolons
    // Strip non-digits, keep only 5-digit strings (valid US ZIPs)
    const parsed = rawInput
      .split(/[\s,;\n\r\t]+/)
      .map((s) => s.trim().replace(/[^0-9]/g, ''))
      .filter((s) => s.length === 5);
    const uniqueZips = [...new Set(parsed)];

    if (uniqueZips.length === 0) return;

    setLoading(true);
    setSearched(true);
    setAllProperties([]);
    const sb = getSupabase();

    // Phase 1: Fetch zip_aggregates (fast — one row per ZIP)
    const zipChunks = chunkArray(uniqueZips, CHUNK_SIZE);
    const zipResults: ZipAggregate[] = [];

    await Promise.all(
      zipChunks.map(async (chunk) => {
        const { data } = await sb
          .from('zip_aggregates')
          .select('*')
          .in('zip', chunk);
        if (data) zipResults.push(...data);
      })
    );

    zipResults.sort((a, b) => b.total_units - a.total_units);
    setZips(zipResults);

    // Compute summary
    const matchedSet = new Set(zipResults.map((z) => z.zip));
    const unmatchedZips = uniqueZips.filter((z) => !matchedSet.has(z));
    const totalUnits = zipResults.reduce((s, z) => s + z.total_units, 0);
    const totalProperties = zipResults.reduce((s, z) => s + z.total_properties, 0);
    const avgRent =
      totalUnits > 0
        ? Math.round(zipResults.reduce((s, z) => s + z.avg_rent * z.total_units, 0) / totalUnits)
        : 0;
    const avgOccupancy =
      totalUnits > 0
        ? Math.round((zipResults.reduce((s, z) => s + z.avg_occupancy * z.total_units, 0) / totalUnits) * 10) / 10
        : 0;

    setSummary({
      matchedZipCount: zipResults.length,
      totalProperties,
      totalUnits,
      avgRent,
      avgOccupancy,
      unmatchedZips,
    });
    setLoading(false);

    // Phase 2: Fetch ALL properties for matched ZIPs (background, paginated)
    const matchedZipCodes = zipResults.map((z) => z.zip);
    if (matchedZipCodes.length === 0) {
      setPropertiesLoading(false);
      return;
    }

    setPropertiesLoading(true);
    const propChunks = chunkArray(matchedZipCodes, CHUNK_SIZE);
    const allProps: Property[] = [];

    await Promise.all(
      propChunks.map(async (chunk) => {
        let offset = 0;
        const PAGE = 1000;
        while (true) {
          const { data } = await sb
            .from('properties')
            .select('*')
            .in('zip', chunk)
            .order('units', { ascending: false })
            .range(offset, offset + PAGE - 1);
          if (!data || data.length === 0) break;
          allProps.push(...data);
          if (data.length < PAGE) break;
          offset += PAGE;
        }
      })
    );

    setAllProperties(allProps);
    setPropertiesLoading(false);
  }, []);

  const clear = useCallback(() => {
    setZips([]);
    setAllProperties([]);
    setSummary(EMPTY_SUMMARY);
    setSearched(false);
  }, []);

  return { zips, allProperties, summary, loading, propertiesLoading, searched, search, clear };
}

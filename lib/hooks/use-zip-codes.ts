'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { ZipAggregate, Property } from '@/types/database';

export function useZipCodes(search = '', market = '', sort = 'total_units') {
  const [zips, setZips] = useState<ZipAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();

    if (search.includes(',')) {
      // Comma-separated: run one query per term, then merge & dedupe
      const terms = search.split(',').map((s) => s.trim()).filter(Boolean);
      const all: ZipAggregate[] = [];

      await Promise.all(
        terms.map(async (term) => {
          let q = sb.from('zip_aggregates').select('*')
            .or(`zip.ilike.%${term}%,city.ilike.%${term}%`);
          if (market) q = q.eq('market', market);
          const { data } = await q.limit(50);
          if (data) all.push(...data);
        })
      );

      // Deduplicate by zip
      const seen = new Set<string>();
      const deduped = all.filter((z) => {
        if (seen.has(z.zip)) return false;
        seen.add(z.zip);
        return true;
      });

      // Sort
      const asc = sort === 'zip' || sort === 'city';
      deduped.sort((a, b) => {
        const av = (a as any)[sort] ?? 0;
        const bv = (b as any)[sort] ?? 0;
        return asc ? (av > bv ? 1 : -1) : (bv > av ? 1 : -1);
      });

      setZips(deduped);
    } else {
      let q = sb.from('zip_aggregates').select('*');
      if (search) q = q.or(`zip.ilike.%${search}%,city.ilike.%${search}%`);
      if (market) q = q.eq('market', market);
      const asc = sort === 'zip' || sort === 'city';
      q = q.order(sort, { ascending: asc }).limit(200);
      const { data } = await q;
      setZips(data || []);
    }

    setLoading(false);
  }, [search, market, sort]);

  useEffect(() => { fetch(); }, [fetch]);

  return { zips, loading, refetch: fetch };
}

export function useZipProperties(zip: string | null) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!zip) { setProperties([]); return; }
    setLoading(true);
    const sb = getSupabase();
    sb.from('properties').select('*').eq('zip', zip)
      .order('units', { ascending: false }).limit(100)
      .then(({ data }) => { setProperties(data || []); setLoading(false); });
  }, [zip]);

  return { properties, loading };
}

export function useZipMgmtBreakdown(zip: string | null) {
  const [breakdown, setBreakdown] = useState<{ management_company: string; unit_count: number; property_count: number }[]>([]);

  useEffect(() => {
    if (!zip) { setBreakdown([]); return; }
    const sb = getSupabase();
    sb.rpc('get_zip_mgmt_breakdown', { zip_code: zip })
      .then(({ data }) => setBreakdown(data || []));
  }, [zip]);

  return breakdown;
}

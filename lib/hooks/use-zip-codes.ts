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
    const hasComma = search.includes(',');
    let q = sb.from('zip_aggregates').select('*');

    // Single-term search: filter server-side
    if (search && !hasComma) {
      q = q.or(`zip.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (market) q = q.eq('market', market);

    const ascending = sort === 'zip' || sort === 'city';
    q = q.order(sort, { ascending }).limit(hasComma ? 5000 : 200);

    const { data } = await q;
    let result = data || [];

    // Comma-separated: filter client-side so we avoid PostgREST encoding issues
    if (hasComma) {
      const terms = search.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      result = result.filter((z) =>
        terms.some((t) => z.zip.toLowerCase().includes(t) || (z.city || '').toLowerCase().includes(t))
      );
    }

    setZips(result);
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

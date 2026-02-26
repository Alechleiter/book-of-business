'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { MgmtSummary, Property } from '@/types/database';

export function useManagementSearch() {
  const [companies, setCompanies] = useState<MgmtSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    const { data } = await sb.rpc('get_mgmt_summary');
    let results = data || [];
    if (search) {
      const s = search.toLowerCase();
      results = results.filter((c: MgmtSummary) =>
        c.management_company.toLowerCase().includes(s)
      );
    }
    setCompanies(results.slice(0, 100));
    setLoading(false);
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  return { companies, loading, search, setSearch };
}

export function useCompanyProperties(company: string | null) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) { setProperties([]); return; }
    setLoading(true);
    const sb = getSupabase();
    sb.from('properties').select('*')
      .ilike('management_company', company)
      .order('units', { ascending: false })
      .limit(200)
      .then(({ data }) => { setProperties(data || []); setLoading(false); });
  }, [company]);

  return { properties, loading };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { Property } from '@/types/database';

/**
 * Fetches properties that share the same management company.
 * Returns up to 200 results sorted by units descending.
 */
export function useCompanyProperties(company: string | null) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!company) { setProperties([]); return; }
    setLoading(true);
    const sb = getSupabase();
    sb.from('properties')
      .select('*')
      .eq('management_company', company)
      .order('units', { ascending: false })
      .range(0, 199)
      .then(({ data }) => {
        setProperties(data || []);
        setLoading(false);
      });
  }, [company]);

  return { properties, loading };
}

/**
 * Fetches properties that share the same regional supervisor.
 * Returns up to 200 results sorted by units descending.
 */
export function useRegionalProperties(supervisor: string | null) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supervisor) { setProperties([]); return; }
    setLoading(true);
    const sb = getSupabase();
    sb.from('properties')
      .select('*')
      .eq('regional_supervisor', supervisor)
      .order('units', { ascending: false })
      .range(0, 199)
      .then(({ data }) => {
        setProperties(data || []);
        setLoading(false);
      });
  }, [supervisor]);

  return { properties, loading };
}

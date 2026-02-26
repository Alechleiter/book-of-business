'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { Property, PropertyFilters } from '@/types/database';

export function useProperties(filters: PropertyFilters, page = 0, pageSize = 50) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    let q = sb.from('properties').select('*', { count: 'exact' });

    if (filters.search) {
      q = q.textSearch('fts', filters.search.split(/\s+/).join(' & '), { type: 'websearch' });
    }
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.market) q = q.eq('market', filters.market);
    if (filters.housing_type) q = q.eq('housing_type', filters.housing_type);
    if (filters.classification) q = q.eq('classification', filters.classification);
    if (filters.software_system) q = q.ilike('software_system', filters.software_system);
    if (filters.built_type) q = q.eq('built_type', filters.built_type);
    if (filters.county) q = q.eq('county', filters.county);
    if (filters.management_company) q = q.ilike('management_company', `%${filters.management_company}%`);
    if (filters.ownership) q = q.ilike('ownership', `%${filters.ownership}%`);
    if (filters.submarket) q = q.eq('submarket', filters.submarket);
    if (filters.neighborhood) q = q.ilike('neighborhood', `%${filters.neighborhood}%`);
    if (filters.min_units) q = q.gte('units', filters.min_units);
    if (filters.max_units) q = q.lte('units', filters.max_units);
    if (filters.min_rent) q = q.gte('avg_rent', filters.min_rent);
    if (filters.max_rent) q = q.lte('avg_rent', filters.max_rent);
    if (filters.min_occupancy) q = q.gte('occupancy', filters.min_occupancy);
    if (filters.max_occupancy) q = q.lte('occupancy', filters.max_occupancy);
    if (filters.min_year_built) q = q.gte('year_built', filters.min_year_built);
    if (filters.max_year_built) q = q.lte('year_built', filters.max_year_built);
    if (filters.has_concessions) q = q.eq('has_concessions', true);
    if (filters.has_phone) q = q.neq('phone', null);
    if (filters.has_email) q = q.neq('email', null);
    if (filters.regional_supervisor) q = q.ilike('regional_supervisor', `%${filters.regional_supervisor}%`);
    if (filters.has_regional) q = q.neq('regional_supervisor', null);

    q = q.order('units', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, count: total, error } = await q;
    if (!error && data) {
      setProperties(data);
      setCount(total || 0);
    }
    setLoading(false);
  }, [filters, page, pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { properties, count, loading, refetch: fetch };
}

export function useProperty(id: number | null) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setProperty(null); return; }
    setLoading(true);
    const sb = getSupabase();
    sb.from('properties').select('*').eq('id', id).single()
      .then(({ data }) => { setProperty(data); setLoading(false); });
  }, [id]);

  return { property, loading };
}

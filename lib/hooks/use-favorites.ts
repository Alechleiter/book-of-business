'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { Favorite } from '@/types/database';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    const { data } = await sb
      .from('favorites')
      .select('*, properties(*)')
      .eq('user_name', 'team')
      .order('created_at', { ascending: false });
    const favs = data || [];
    setFavorites(favs);
    setFavoriteIds(new Set(favs.map((f: Favorite) => f.property_id)));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = useCallback(async (propertyId: number) => {
    const sb = getSupabase();
    if (favoriteIds.has(propertyId)) {
      await sb.from('favorites').delete()
        .eq('property_id', propertyId).eq('user_name', 'team');
    } else {
      await sb.from('favorites').insert({ property_id: propertyId, user_name: 'team' });
    }
    fetch();
  }, [favoriteIds, fetch]);

  return { favorites, favoriteIds, loading, toggle, refetch: fetch };
}

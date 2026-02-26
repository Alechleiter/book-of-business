'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { PipelineItem } from '@/types/database';

export function usePipeline(stageFilter = '') {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    let q = sb.from('pipeline').select('*, properties(*)').order('updated_at', { ascending: false });
    if (stageFilter) q = q.eq('stage', stageFilter);
    const { data } = await q;
    setItems(data || []);
    setLoading(false);
  }, [stageFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const addToPipeline = useCallback(async (propertyId: number, stage = 'prospect') => {
    const sb = getSupabase();
    await sb.from('pipeline').upsert(
      { property_id: propertyId, stage },
      { onConflict: 'property_id' }
    );
    fetch();
  }, [fetch]);

  const updateStage = useCallback(async (propertyId: number, stage: string) => {
    const sb = getSupabase();
    await sb.from('pipeline').update({ stage, updated_at: new Date().toISOString() })
      .eq('property_id', propertyId);
    fetch();
  }, [fetch]);

  const removeFromPipeline = useCallback(async (propertyId: number) => {
    const sb = getSupabase();
    await sb.from('pipeline').delete().eq('property_id', propertyId);
    fetch();
  }, [fetch]);

  return { items, loading, addToPipeline, updateStage, removeFromPipeline, refetch: fetch };
}

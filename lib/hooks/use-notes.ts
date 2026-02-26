'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import type { Note } from '@/types/database';

export function useNotes(propertyId: number | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!propertyId) { setNotes([]); return; }
    setLoading(true);
    const sb = getSupabase();
    const { data } = await sb.from('notes').select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addNote = useCallback(async (text: string, noteType = 'general') => {
    if (!propertyId || !text.trim()) return;
    const sb = getSupabase();
    await sb.from('notes').insert({
      property_id: propertyId,
      note: text.trim(),
      note_type: noteType,
      author: 'team',
    });
    fetch();
  }, [propertyId, fetch]);

  return { notes, loading, addNote, refetch: fetch };
}

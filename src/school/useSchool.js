import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Who is this adult, and what may they see?
 *
 * Answered by asking the database, never by reading what they picked at
 * signup. my_schools() returns rows only for a live school membership, so a
 * parent gets none and someone who chose "school" on the signup screen still
 * gets none. The UI routes on the answer rather than on the claim.
 */
export function useSchoolContext(session) {
  const [schools, setSchools] = useState(null);   // null = still asking
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!supabase || !session) { setSchools(null); return undefined; }
    let cancelled = false;
    (async () => {
      const [{ data: s }, { data: c }] = await Promise.all([
        supabase.rpc('my_schools'),
        supabase.rpc('my_classes'),
      ]);
      if (cancelled) return;
      setSchools(s || []);
      setClasses(c || []);
    })().catch(() => { if (!cancelled) setSchools([]); });
    return () => { cancelled = true; };
  }, [session]);

  return {
    loading: schools === null,
    isSchoolUser: Array.isArray(schools) && schools.length > 0,
    schools: schools || [],
    classes,
  };
}

const CACHE_KEY = 'lexia_roster_cache';

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
}

/**
 * A class roster, with the last good copy kept.
 *
 * School connections drop. A director who opens this on a bad line should see
 * Tuesday's numbers labelled as Tuesday's, not an empty screen that reads as
 * "the app is broken". Stale data with an honest timestamp beats nothing.
 */
export function useRoster(classId) {
  const cached = readCache()[classId];
  const [rows, setRows] = useState(cached?.rows || null);
  const [asOf, setAsOf] = useState(cached?.at || null);
  const [stale, setStale] = useState(Boolean(cached));
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!supabase || !classId) return;
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('class_roster', {
        p_class_id: classId,
      });
      if (err) throw err;
      const at = new Date().toISOString();
      setRows(data || []);
      setAsOf(at);
      setStale(false);
      const all = readCache();
      all[classId] = { rows: data || [], at };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(all)); } catch { /* full */ }
    } catch {
      // Keep whatever we last had, and say how old it is.
      setStale(true);
      if (!rows) setError('Could not load the class right now.');
    }
  }, [classId, rows]);

  useEffect(() => {
    const c = readCache()[classId];
    setRows(c?.rows || null);
    setAsOf(c?.at || null);
    setStale(Boolean(c));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  return { rows, asOf, stale, error, reload: load };
}

/** "as of Tuesday 15:04", or "just now" when it is fresh. */
export function describeAsOf(iso, stale) {
  if (!iso) return '';
  const then = new Date(iso);
  if (!stale) return 'up to date';
  const day = then.toLocaleDateString(undefined, { weekday: 'long' });
  const time = then.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const sameDay = new Date().toDateString() === then.toDateString();
  return sameDay ? `as of ${time}` : `as of ${day} ${time}`;
}

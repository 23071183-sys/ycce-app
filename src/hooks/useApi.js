import { useCallback, useEffect, useRef, useState } from 'react';
import api, { reportError } from '../services/api';

// Loads a GET endpoint and tracks the states every screen needs: the first
// load, pull-to-refresh, and failure. Pass null as the path to skip loading
// (for example while a required id isn't known yet).
//
//   const { data, loading, error, refreshing, refresh } = useApi('/attendance/overall');
export default function useApi(path, { params, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(path));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params || {});
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  // mode: 'load' shows the skeleton, 'refresh' the pull-to-refresh spinner,
  // 'quiet' neither (for refetching when a screen regains focus).
  const load = useCallback(async (mode = 'load') => {
    if (!path) { setLoading(false); return; }
    if (mode === 'refresh') setRefreshing(true); else if (mode === 'load') setLoading(true);
    try {
      const res = await api.get(path, { params: JSON.parse(paramsKey) });
      if (!mounted.current) return;
      setData(res.data);
      setError(null);
    } catch (err) {
      reportError(err);
      if (mounted.current) setError(err);
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, [path, paramsKey]);

  useEffect(() => { load('load'); }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const revalidate = useCallback(() => load('quiet'), [load]);

  return { data, setData, loading, error, refreshing, refresh, revalidate, reload: () => load('load') };
}

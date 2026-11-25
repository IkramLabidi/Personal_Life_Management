import { useCallback, useEffect, useRef, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

/** Fetch a single object/aggregate resource with loading + error handling. */
export function useFetch(path, params = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get(path, paramsRef.current ? { params: paramsRef.current } : undefined);
      setData(res);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, paramsKey]);

  return { data, setData, loading, error, reload };
}

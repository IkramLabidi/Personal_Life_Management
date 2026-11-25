import { useCallback, useEffect, useRef, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

/**
 * Fetch a list resource with loading/error/empty handling and CRUD helpers
 * that always re-sync from the server (MongoDB is the source of truth).
 */
export function useCollection(path, params = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(path, { params: paramsRef.current });
      setItems(Array.isArray(data) ? data : []);
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

  const create = useCallback(
    async (payload) => {
      const { data } = await api.post(path, payload);
      await reload();
      return data;
    },
    [path, reload]
  );

  const update = useCallback(
    async (id, payload) => {
      const { data } = await api.put(`${path}/${id}`, payload);
      await reload();
      return data;
    },
    [path, reload]
  );

  const remove = useCallback(
    async (id) => {
      await api.delete(`${path}/${id}`);
      await reload();
    },
    [path, reload]
  );

  return { items, setItems, loading, error, reload, create, update, remove };
}

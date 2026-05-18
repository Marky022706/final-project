// src/hooks/useFetch.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

export const useFetch = <T = any>(url: string, immediate = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const immediateRef = useRef(immediate);
  const urlRef = useRef(url);
  urlRef.current = url;

  const execute = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(urlRef.current, { params });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data.');
      }
    } catch (err: any) {
      console.error(`Fetch error at ${urlRef.current}:`, err);
      setError(err.response?.data?.message || err.message || 'An error occurred while loading data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediateRef.current) {
      execute();
    }
  }, [execute]);

  return { data, loading, error, execute, setData };
};
export default useFetch;

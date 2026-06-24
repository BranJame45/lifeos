'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/**
 * Caché en memoria (vive mientras la SPA esté montada) + stale-while-revalidate.
 *
 * Al volver a un módulo ya visitado, devuelve al instante lo cacheado y
 * revalida en segundo plano. Así la navegación se siente inmediata en lugar
 * de mostrar un skeleton cada vez.
 */
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

/** Lee el valor cacheado de una clave (o undefined). */
export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/** Escribe/actualiza la caché. Útil tras un update optimista. */
export function setCached<T>(key: string, value: T): void {
  cache.set(key, value);
}

/** Invalida una clave (o todas si no se pasa). El próximo uso re-fetchea. */
export function invalidate(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}

interface State<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
}

/**
 * GET con caché. `key` es la ruta del endpoint (sirve también de clave).
 * - 1ª vez: loading=true, fetch.
 * - Revisita: data inmediata desde caché, loading=false, revalida en background.
 */
export function useApiData<T>(key: string | null) {
  const [state, setState] = useState<State<T>>(() => ({
    data: key ? getCached<T>(key) : undefined,
    loading: key ? !cache.has(key) : false,
    error: undefined,
  }));
  const mounted = useRef(true);

  const run = useCallback(
    async (k: string, background: boolean) => {
      if (!background) setState((s) => ({ ...s, loading: !cache.has(k) }));
      try {
        // Coalesce: si ya hay un fetch en vuelo para esta clave, reúsalo.
        let p = inflight.get(k) as Promise<T> | undefined;
        if (!p) {
          p = api.get<T>(k);
          inflight.set(k, p);
        }
        const data = await p;
        cache.set(k, data);
        if (mounted.current) setState({ data, loading: false, error: undefined });
      } catch (error) {
        if (mounted.current) setState((s) => ({ ...s, loading: false, error }));
      } finally {
        inflight.delete(k);
      }
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    if (!key) return;
    const cached = getCached<T>(key);
    if (cached !== undefined) {
      // Mostrar al instante + revalidar en segundo plano.
      setState({ data: cached, loading: false, error: undefined });
      run(key, true);
    } else {
      run(key, false);
    }
    return () => {
      mounted.current = false;
    };
  }, [key, run]);

  const refresh = useCallback(() => {
    if (key) return run(key, true);
  }, [key, run]);

  /** Setea data localmente y la persiste en caché (para updates optimistas). */
  const mutate = useCallback(
    (updater: (prev: T | undefined) => T) => {
      setState((s) => {
        const next = updater(s.data);
        if (key) cache.set(key, next);
        return { ...s, data: next };
      });
    },
    [key],
  );

  return { ...state, refresh, mutate };
}

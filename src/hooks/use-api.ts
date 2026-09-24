"use client";

// useApi — the one place a screen fetches from the API.
//
// The reference back office uses a richer `useListQuery` built around
// limit/offset pagination. This API has none: every list is bounded by a date
// range instead, so the pagination half of that hook would be dead code here.
// What is kept is the part that mattered — one abortable request per
// parameter change, a single place that turns a failure into a message, and a
// `refresh` that re-runs the same call after a mutation.

import { useCallback, useEffect, useRef, useState } from "react";

import { api, errorMessage, isForbidden, isPlanLimited, type QueryParams } from "@/lib/api/client";

export interface UseApiResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  /** True when the API refused the caller's role — a different screen state
   * from a generic failure, because retrying will not help. */
  forbidden: boolean;
  /** True when the API refused the tenant's PLAN rather than the caller's
   * role — a 402. A separate flag from `forbidden` because the screen, and
   * the person who can fix it, are different. */
  planLimited: boolean;
  refresh: () => void;
}

export function useApi<T>(path: string | null, query?: QueryParams): UseApiResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [forbidden, setForbidden] = useState(false);
  const [planLimited, setPlanLimited] = useState(false);
  const [tick, setTick] = useState(0);

  // One serialised key, carrying both the query and the refresh counter.
  //
  // Serialised because the effect's dependency must stay primitive: a fresh
  // object literal is never referentially equal to the last one, so passing
  // `query` directly would re-fire on every render. The tick rides along
  // inside it rather than sitting beside it in the dependency array, so it is
  // genuinely read by the effect instead of being an unused dependency the
  // linter is right to flag. Same shape as the reference's useListQuery.
  const requestKey = JSON.stringify({ query: query ?? {}, tick });

  // Kept in a ref so an in-flight response from a previous parameter set
  // cannot overwrite the current one when it lands late.
  const requestId = useRef(0);

  useEffect(() => {
    if (path === null) {
      setData(undefined);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);

    const { query: params } = JSON.parse(requestKey) as { query: QueryParams };

    api
      .get<T>(path, params, controller.signal)
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        setForbidden(false);
        setPlanLimited(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || id !== requestId.current) return;
        setData(undefined);
        setError(errorMessage(err));
        setForbidden(isForbidden(err));
        setPlanLimited(isPlanLimited(err));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });

    return () => controller.abort();
  }, [path, requestKey]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, forbidden, planLimited, refresh };
}

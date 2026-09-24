"use client";

// useQueryParam — a filter that lives in the URL rather than in component
// state.
//
// Taken from the reference back office's useListQuery: a filter kept only in
// React state cannot be shared, bookmarked, or recovered with the back
// button, and on these screens the filter IS the question being asked — "what
// happened on the 19th" is worth a link.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useQueryParam(key: string, fallback: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key) ?? fallback;

  const setValue = useCallback(
    (next: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next && next !== fallback) params.set(key, next);
      else params.delete(key);
      // replace, not push: changing a filter should not stack history entries
      // that the back button then has to walk through one at a time.
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, key, fallback],
  );

  return [value, setValue] as const;
}

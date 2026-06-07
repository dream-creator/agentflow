"use client";

import { useEffect, useState } from "react";

/**
 * Persist a single value in sessionStorage with a useState-shaped API.
 *
 * Behavior:
 * - SSR-safe: never touches `window` or `sessionStorage` during the
 *   initial render. The first read happens in a useEffect, which only
 *   runs client-side after hydration.
 * - Tolerant: both the read and the write are wrapped in try/catch so a
 *   `SecurityError` (Safari private mode, sandboxed iframes) or
 *   `QuotaExceededError` does not crash the consumer.
 * - Stable: returns `[value, setValue]` exactly like `useState` so call
 *   sites read naturally.
 * - Session-scoped: the value lives for the tab session, not forever.
 *   Close the tab → value is gone (banner reappears next visit).
 *
 * @param key   sessionStorage key.
 * @param initialValue  fallback when nothing is stored or storage is unavailable.
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
): readonly [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);

  // Hydrate from sessionStorage exactly once after mount.
  // SSR returns `initialValue`; the first client render also returns
  // `initialValue` to avoid a hydration mismatch — the value flips to
  // the stored value in a follow-up effect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      // Corrupt JSON, private mode, or sandboxed iframe — fall back to
      // initialValue silently. The consumer still gets a working
      // in-memory state.
    }
  }, [key]);

  // Persist every change back to sessionStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled — non-fatal, the in-memory
      // value still works for the current session.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

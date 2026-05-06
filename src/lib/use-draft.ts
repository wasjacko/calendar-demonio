"use client";

import * as React from "react";

/**
 * Persiste un objet "brouillon" (form draft) dans localStorage
 * pour que rien ne soit perdu si l'utilisateur ferme l'onglet,
 * recharge la PWA ou navigue ailleurs.
 *
 * - Lit la valeur sauvegardée au mount (et quand `key` change).
 * - Sauvegarde automatiquement à chaque changement (debounced).
 * - Expose `clear()` pour vider le brouillon (à appeler après save).
 *
 * Si `key` est `null`, le hook ne lit/écrit pas (utile quand le contexte
 * n'est pas encore connu, ex: post pas encore chargé).
 */
export function useDraft<T>(
  key: string | null,
  initial: T,
  options?: { debounceMs?: number }
) {
  const debounceMs = options?.debounceMs ?? 250;
  const storageKey = key ? `editorial-draft:${key}` : null;

  const [value, setValue] = React.useState<T>(initial);
  const [hydrated, setHydrated] = React.useState(false);

  // Use a ref so the loader doesn't reset when `initial` identity changes
  const initialRef = React.useRef(initial);
  initialRef.current = initial;

  // Load draft when key changes
  React.useEffect(() => {
    setHydrated(false);
    if (!storageKey) {
      setValue(initialRef.current);
      setHydrated(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setValue(JSON.parse(raw) as T);
      } else {
        setValue(initialRef.current);
      }
    } catch {
      setValue(initialRef.current);
    }
    setHydrated(true);
  }, [storageKey]);

  // Save draft on change (debounced)
  React.useEffect(() => {
    if (!hydrated || !storageKey) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {}
    }, debounceMs);
    return () => clearTimeout(t);
  }, [value, hydrated, debounceMs, storageKey]);

  const clear = React.useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
    setValue(initialRef.current);
  }, [storageKey]);

  return { value, setValue, clear, hydrated };
}

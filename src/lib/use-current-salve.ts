"use client";

import * as React from "react";

const STORAGE_KEY = "editorial-current-salve";

interface CurrentSalve {
  legion: number;
  salve: 1 | 2 | 3;
}

const DEFAULT: CurrentSalve = { legion: 1, salve: 1 };

export function useCurrentSalve() {
  const [state, setState] = React.useState<CurrentSalve>(DEFAULT);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CurrentSalve;
        if (parsed.legion >= 1 && [1, 2, 3].includes(parsed.salve)) {
          setState(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setCurrent = React.useCallback((next: CurrentSalve) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    // Notify other tabs
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  // Sync across tabs
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setState(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { ...state, setCurrent, hydrated };
}

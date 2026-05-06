"use client";

import * as React from "react";

// Light mode forcé — pas de toggle, pas de stockage, pas de dark mode
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }, []);

  return <>{children}</>;
}

// Stub pour compat — au cas où d'anciens composants l'appellent
export function useTheme() {
  return {
    theme: "light" as const,
    resolvedTheme: "light" as const,
    setTheme: () => {},
  };
}

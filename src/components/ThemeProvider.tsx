"use client";

import * as React from "react";
import { usePersistedValue } from "@/lib/client-state";

/**
 * Design system §1.8 - the inversion mechanism.
 *
 * Toggling `data-theme` on the root element swaps every semantic token at
 * once. No page reload, no component changes: this is exactly what wiring
 * every component to tokens from day one buys us.
 *
 * v1 ships light as the default (per §1.8) rather than following the OS, but
 * the dark token set is complete and the toggle is live in Account settings.
 */

type Theme = "light" | "dark";

const STORAGE_KEY = "brains-theme";

const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

const THEMES = ["light", "dark"] as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Light is the default - the empirical marketing & studio surfaces are
  // designed around the light palette, and §1.8 ships light as v1 default.
  // Dark remains one click away in Account settings.
  const [theme, setTheme] = usePersistedValue<Theme>(
    STORAGE_KEY,
    THEMES,
    "light",
  );

  // Mirrors the stored preference onto the root element, which is what the
  // token sets key off. ThemeScript does this before first paint; this keeps
  // it in step on every later change.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ThemeScript moved to ./ThemeScript.tsx as a Server Component to avoid
// "script tag while rendering React component" in Next 16 client components.
export { ThemeScript } from "./ThemeScript";

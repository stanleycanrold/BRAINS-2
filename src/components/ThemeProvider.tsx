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
  // Dark is the product's default. A founder reading a long report is sitting
  // with this screen for a while, and the warm dark canvas is the more
  // comfortable place to do that; light remains one click away.
  const [theme, setTheme] = usePersistedValue<Theme>(
    STORAGE_KEY,
    THEMES,
    "dark",
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

/**
 * Applies the stored theme before first paint, so a dark-mode user never sees
 * a flash of the light theme on load.
 */
export function ThemeScript() {
  // Runs before first paint so a dark-mode user never sees a flash of light.
  // Because it mutates <html> ahead of hydration, the root element carries
  // suppressHydrationWarning - React would otherwise flag the attribute it
  // finds as a server/client mismatch.
  const script = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;
  return (
    <script
      id="brains-theme"
      // Marks this as a plain DOM script rather than something React should
      // try to reconcile, which is what triggered the "script tag while
      // rendering React component" warning.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

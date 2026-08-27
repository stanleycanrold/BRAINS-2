"use client";

import * as React from "react";

/**
 * The same inversion mechanism as the product app: `data-theme` on the root
 * element swaps every semantic token at once (tokens.css), so the whole site
 * is one consistent theme at a time - never a mix.
 *
 * The marketing site ships light as the default, the nav carries a toggle,
 * and the choice persists across visits.
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy init reads the same key ThemeScript applied before first paint, so
  // provider state and the DOM attribute agree from the first client render.
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // Mirrors the preference onto the root element, which is what the token
  // sets key off. ThemeScript does this before first paint; this keeps it in
  // step on every later change.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode): the theme still applies now.
    }
    setThemeState(next);
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Applies the stored theme before first paint, so a dark-mode user never
 * sees a flash of the light default on load.
 */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;
  return (
    <script
      id="brains-theme"
      // Plain DOM script, not something React reconciles; the root element
      // also carries suppressHydrationWarning for the same reason.
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

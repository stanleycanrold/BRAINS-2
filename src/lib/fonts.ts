import { Public_Sans, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

/**
 * Three type roles, per design system §1.3 — deliberately not "one grotesk for
 * everything". All three are self-hosted (no external font requests at
 * runtime, no layout shift).
 */

/** Display — page titles, section headers, report headline. */
export const generalSans = localFont({
  src: [
    { path: "../app/fonts/GeneralSans-400.woff2", weight: "400", style: "normal" },
    { path: "../app/fonts/GeneralSans-500.woff2", weight: "500", style: "normal" },
    { path: "../app/fonts/GeneralSans-600.woff2", weight: "600", style: "normal" },
    { path: "../app/fonts/GeneralSans-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** Body — chosen over Inter specifically because Inter is the default-by-default
 *  across AI products right now (§1.3). */
export const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
  display: "swap",
});

/** Data/Mono — the Score, rates, counts, IDs. Anything measured, never
 *  anything written. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontVariables = [
  generalSans.variable,
  publicSans.variable,
  jetbrainsMono.variable,
].join(" ");

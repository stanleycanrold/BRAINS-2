import { Public_Sans, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

/**
 * Three type roles, matching the app exactly (design system §1.3). All three
 * are self-hosted - no external font requests at runtime, no layout shift.
 */

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

export const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
  display: "swap",
});

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

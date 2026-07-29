import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import "./globals.css";
import { SITE_URL } from "@/lib/urls";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "BRAINS AI",
  title: {
    default: "BRAINS AI - Know if your idea is worth building",
    template: "%s | BRAINS AI",
  },
  description:
    "Describe your idea and BRAINS AI researches whether the problem is real, gets you answers from actual people, and gives you a score with the reasoning behind it. Evidence over opinion.",
  openGraph: {
    type: "website",
    siteName: "BRAINS AI",
    title: "BRAINS AI - Know if your idea is worth building",
    description:
      "Research, real answers, and a score you can argue with - before you spend months building.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BRAINS AI - Know if your idea is worth building",
    description:
      "Research, real answers, and a score you can argue with - before you spend months building.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1e1d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        {/* Hidden until focused - lets a keyboard or screen-reader user skip
            the nav that repeats on every page (UX guide, Part 14). */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-[8px] focus:bg-brand focus:px-4 focus:py-2 focus:text-on-accent"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

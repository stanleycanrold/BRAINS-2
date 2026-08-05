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
    default: "BRAINS AI - Validate ideas. Find first customers.",
    template: "%s | BRAINS AI",
  },
  description:
    "Turn an idea into a clearer path to market. BRAINS AI helps you validate the problem, find early buyers, and start the right conversations.",
  openGraph: {
    type: "website",
    siteName: "BRAINS AI",
    title: "BRAINS AI - Validate ideas. Find first customers.",
    description:
      "Validate the problem, find early buyers, and start the right conversations before you build.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BRAINS AI - Validate ideas. Find first customers.",
    description:
      "Validate the problem, find early buyers, and start the right conversations before you build.",
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
        {/* Bottom padding below `md` clears the sticky mobile CTA bar, which
            is fixed to the viewport and was covering the last element on every
            page - usually the closing composer, which is the worst thing on
            the page to hide. */}
        <main id="main" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

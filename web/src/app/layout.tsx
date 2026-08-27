import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { ThemeProvider, ThemeScript } from "@/components/ThemeProvider";
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
    <html
      lang="en"
      data-theme="light"
      className={`${fontVariables} h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <SiteJsonLd />
        {/* Page chrome (nav/footer) lives one level down: the (site) group
            wraps the content pages in the shared shell, and the landing
            mounts the same nav and footer itself. The whole site is one
            theme at a time; the nav toggle flips every token at once. */}
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

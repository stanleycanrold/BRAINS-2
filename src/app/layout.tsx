import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { fontVariables } from "@/lib/fonts";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeScript } from "@/components/ThemeScript";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BRAINS AI - Validation Engine",
    template: "%s · BRAINS AI",
  },
  description:
    "Take an idea from a sentence to a decision. BRAINS AI researches the problem space, helps you gather real signal, and returns a score with the reasoning behind it.",
  applicationName: "BRAINS AI",
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
    <ClerkProvider>
      <html
        lang="en"
        data-theme="light"
        className={`${fontVariables} h-full`}
        suppressHydrationWarning
      >
        <head>
          <ThemeScript />
        </head>
        <body className="flex min-h-full flex-col">
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

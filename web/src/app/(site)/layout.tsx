import { MarketingShell } from "@/components/landing/MarketingShell";

/**
 * Chrome for the original-copy pages (blog index, validation guides,
 * research). They keep their own internal layout but sit inside the
 * empirical marketing shell - the zip navbar, footer and idea composer -
 * so the whole site reads as one product. The landing and the other
 * marketing routes mount the same shell themselves at their route level.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MarketingShell>{children}</MarketingShell>;
}

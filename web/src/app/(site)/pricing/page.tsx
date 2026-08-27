import type { Metadata } from "next";
import { PricingPage } from "@/components/landing/pages";
import { PricingDetails } from "@/components/landing/PricingDetails";

/**
 * Pricing: the empirical pricing billboards first, then the site's published
 * pricing facts (deliverables, tracks, per-response rates, FAQ) folded in
 * below in the same design language. The shared nav/footer chrome comes from
 * the (site) layout.
 */
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Validation is free to run yourself. Paying buys back the legwork of finding and talking to people, not a better answer. How the price is put together, in full.",
};

export default function Page() {
  return (
    <>
      <PricingPage />
      <PricingDetails />
    </>
  );
}

import type { Metadata } from "next";
import { SITE_URL } from "@/lib/urls";
import { HowItWorksBody } from "./HowItWorksBody";

/**
 * How it works, restyled in the empirical design language. Aligned to the
 * app's real pipeline: entry, research, validate, decide - the four steps
 * the product's own top bar shows a signed-in founder, in the same order.
 */
export const metadata: Metadata = {
  title: "How it works",
  description:
    "The four steps of a validation round: describe the idea, research it against real sources, get answers from people who have the problem, and decide on a scored report.",
  alternates: { canonical: `${SITE_URL}/how-it-works` },
};

export default function HowItWorksPage() {
  return <HowItWorksBody />;
}

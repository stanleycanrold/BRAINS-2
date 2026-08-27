import type { Metadata } from "next";
import { SITE_URL } from "@/lib/urls";
import { AboutBody } from "./AboutBody";

/**
 * About, restyled in the empirical design language. The copy is carried
 * verbatim from the previous design; the shell (navbar, footer, composer)
 * comes from the marketing shell this route group is wrapped in.
 */
export const metadata: Metadata = {
  title: "About",
  description:
    "Why BRAINS AI exists and the rules it holds even when they make the product look worse in the short term.",
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return <AboutBody />;
}

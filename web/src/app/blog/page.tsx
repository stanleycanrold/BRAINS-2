import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { MobileCta } from "@/components/MobileCta";
import { signUpUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on validating ideas before building them: what actually counts as evidence, how many people you need to talk to, and how to read a weak signal honestly.",
};

/**
 * The listing shell, with an honest empty state.
 *
 * Nav links here (UX guide 2.1 fixes the nav at three items), so the route
 * has to exist. What it must not do is invent posts to look established -
 * a marketing site padded with placeholder articles is exactly the thing
 * this product's own writing standards exist to prevent. When real posts
 * land, they replace this block; the page structure does not change.
 */
export default function BlogPage() {
  return (
    <>
      <MobileCta />

      <section className="pt-16 pb-4 sm:pt-24">
        <Container>
          <div className="mx-auto max-w-[640px] text-center">
            <h1 className="type-display-xl text-primary">Blog</h1>
            <p className="type-body-l mt-5 text-secondary">
              Writing on validating ideas before building them. What counts as
              evidence, how many people you actually need to talk to, and how
              to read a weak signal without flinching from it.
            </p>
          </div>
        </Container>
      </section>

      <Section bordered className="pb-28 sm:pb-32">
        <div className="mx-auto max-w-[560px] rounded-[16px] border border-line bg-raised p-10 text-center">
          <h2 className="type-display-m text-primary">
            Nothing published yet
          </h2>
          <p className="type-body-l mt-3 text-secondary">
            The first pieces are being written now. Rather than fill this page
            with placeholder posts, it stays empty until there is something
            worth your time on it.
          </p>
          <div className="mt-7">
            <Button href={signUpUrl} variant="primary">
              Validate an idea instead
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}

import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { signUpUrl } from "@/lib/urls";

/**
 * Four columns (UX guide 2.2). "Validate by category" is real internal-link
 * value once the pSEO pages exist; until they do it links to the hub rather
 * than to pages that would 404, since a footer full of dead links is worse
 * than a short one.
 */

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing#fast-track", label: "Fast Track" },
    ],
  },
  {
    title: "Validate",
    links: [
      { href: "/validation", label: "All guides" },
      {
        href: "/validation/marketplace-startup-idea",
        label: "Marketplace ideas",
      },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/validation", label: "Answers" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: signUpUrl, label: "Create an account" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <Container className="py-14 sm:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <Logo size={16} />
            <p className="type-body-m mt-4 text-secondary">
              A validation engine for founders. Evidence over opinion, with the
              reasoning always shown.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 sm:gap-12">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="type-caption text-tertiary uppercase">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="type-body-m text-secondary transition-colors duration-[120ms] hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-caption text-tertiary">
            © {new Date().getFullYear()} BRAINS AI
          </p>
          <p className="type-caption text-tertiary">
            A signal, not a guarantee.
          </p>
        </div>
      </Container>
    </footer>
  );
}

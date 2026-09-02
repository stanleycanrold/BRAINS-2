import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { signUpUrl } from "@/lib/urls";

/**
 * The footer is nav, in every sense that matters: hand-maintained site chrome
 * that has to stay short to stay useful.
 *
 * So it carries services and company links only. It deliberately does not
 * list individual articles - those are reached from search, the sitemap, and
 * the computed cross-links between them, and a footer that grows an entry per
 * page stops being scannable long before the content stops growing.
 *
 * The previous version linked "How it works" twice across two columns, and
 * pointed a link labelled "Answers" at the validation page.
 */

const COLUMNS: { title: string; links: { href: string; label: string; action?: string }[] }[] = [
  {
    title: "Services",
    links: [
      { href: "/validation", label: "Validation" },
      { href: "/pricing#social-scan", label: "Continued Social Scan" },
    ],
  },
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing#fast-track", label: "Fast Track" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "#contact", label: "Contact us", action: "contact" },
    ],
  },
  {
    title: "Get started",
    links: [{ href: signUpUrl, label: "Create an account" }],
  },
];

export function Footer({ onContact }: { onContact?: () => void }) {
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
                      {link.action === "contact" ? (
                        <button
                          type="button"
                          onClick={() => onContact?.()}
                          className="type-body-m text-secondary transition-colors duration-[120ms] hover:text-primary text-left"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          href={link.href}
                          className="type-body-m text-secondary transition-colors duration-[120ms] hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      )}
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
          {/* Terms and privacy belong here once those routes exist. The
              disclaimer that used to sit in this slot moved to the terms of
              service, which is where a user actually agrees to it. */}
          <p className="type-caption text-tertiary">
            Validate before you build.
          </p>
        </div>
      </Container>
    </footer>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";
import { Button } from "./Button";
import { Container } from "./Container";
import { signInUrl, signUpUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";

/**
 * Top navigation, not a sidebar. The app's shell decision goes the other way
 * for a record-management tool; this is a content and conversion site, and
 * top nav is right here for the same reason it is wrong there.
 *
 * Exactly three links (UX guide 2.1). More links dilute which ones matter,
 * and a marketing nav should be scannable in a single glance.
 *
 * Condensing on scroll: the bar loses height and gains a border once the
 * hero is behind you, so Sign up stays one tap away through a long page
 * without the full nav competing for space the whole way down.
 */

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function Nav() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-page/80 backdrop-blur-md",
        "transition-[height,border-color] duration-200",
        scrolled ? "border-b border-line" : "border-b border-transparent",
      )}
    >
      <Container
        className={cn(
          "flex items-center justify-between transition-[height] duration-200",
          scrolled ? "h-14" : "h-[72px]",
        )}
      >
        <Link href="/" className="shrink-0" aria-label="BRAINS AI home">
          <Logo priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "type-body-m transition-colors duration-[120ms]",
                  active ? "text-primary" : "text-secondary hover:text-primary",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button href={signInUrl} variant="ghost" size="compact">
            Log in
          </Button>
          <Button href={signUpUrl} variant="primary" size="compact">
            Sign up
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="-mr-1.5 rounded-[8px] p-2 text-secondary hover:text-primary md:hidden"
        >
          {open ? (
            <XIcon size={22} aria-hidden="true" />
          ) : (
            <ListIcon size={22} aria-hidden="true" />
          )}
        </button>
      </Container>

      <div
        className={cn(
          "overflow-hidden border-line md:hidden",
          open ? "max-h-96 border-t" : "max-h-0",
        )}
        style={{ transition: "max-height 200ms ease-out" }}
      >
        <Container className="flex flex-col gap-1 py-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // Closed on click rather than in an effect watching the path:
              // setState inside an effect body triggers cascading renders, and
              // the click is the actual moment the drawer should close anyway.
              onClick={() => setOpen(false)}
              className="type-body-l rounded-[8px] px-2 py-3 text-primary hover:bg-wash-hover"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
            <Button href={signInUrl} variant="secondary">
              Log in
            </Button>
            <Button href={signUpUrl} variant="primary">
              Sign up
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}

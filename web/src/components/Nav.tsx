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

/**
 * Nav is a list of what BRAINS does, not of where content lives.
 *
 * "Validation" is a service, and it is the first of several: growth, market,
 * scale and build get their own entries as those ship, each pointing at its
 * own service page with its own pSEO tree beneath it. Once there is more than
 * one, this becomes a grouped menu rather than four more flat links, because
 * a nav that grows with the catalogue stops being scannable at about six.
 *
 * Articles never appear here at any point. They are reached from search, the
 * sitemap, and the cross-links between them.
 */
const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/validation", label: "Validation" },
];

export function Nav() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  /**
   * Auto-hide on the way down, return on the way up.
   *
   * Reading is the one thing every page here is for, and a bar pinned over
   * the top of a long article is permanently spending vertical space to
   * repeat links nobody is looking for mid-sentence. Coming straight back on
   * an upward scroll means it is never more than a flick away, which is why
   * this is worth more than simply making the bar shorter.
   *
   * Never hidden while the mobile menu is open, and never hidden near the top
   * of the page, both of which would be the bar disappearing out from under
   * someone who is using it.
   */
  const [hidden, setHidden] = React.useState(false);
  const pathname = usePathname();

  /** Screens that behave like the product rather than like a page. */
  const appLike = /^\/research(\/|$)/.test(pathname);

  React.useEffect(() => {
    let last = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);

      // A threshold rather than any movement at all, so the bar does not
      // flicker on the small jitters a trackpad produces at rest.
      if (Math.abs(y - last) > 8) {
        setHidden(y > last && y > 140);
        last = y;
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-page/80 backdrop-blur-md",
        "transition-[height,border-color,transform] duration-200",
        scrolled ? "border-b border-line" : "border-b border-transparent",
        hidden && !open ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <Container
        className={cn(
          "flex items-center justify-between transition-[height] duration-200",
          // Resting height comes from --nav-h so the research brief, which
          // sizes itself to the viewport minus this bar, cannot fall out of
          // step with it.
          scrolled ? "h-14" : "h-[var(--nav-h)]",
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

        {/* One primary action per screen, and on the research brief it is not
            this one.

            That screen carries its own solid button in the bar at the foot of
            the report, where it follows on from the progress it refers to.
            Two solid buttons meaning "make an account" split the eye and make
            the page read as selling twice. So here it drops to an outline:
            still present, still findable by anyone who has decided before
            reaching the bottom, and visibly the second option rather than a
            competing first one.

            Everywhere else this bar IS the primary action, because content
            pages offer the composer instead of a button, and it stays solid. */}
        <div className="hidden items-center gap-2 md:flex">
          <Button href={signInUrl} variant="ghost" size="compact">
            Log in
          </Button>
          <Button
            href={signUpUrl}
            variant={appLike ? "secondary" : "primary"}
            size="compact"
            className={appLike ? "border-brand/50 text-brand hover:bg-brand-subtle" : undefined}
          >
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

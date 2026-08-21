"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ListIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { usePersistedFlag } from "@/lib/client-state";
import { Sidebar, type SidebarIdea } from "./Sidebar";

/**
 * Design system §2.2 - shell anatomy.
 *
 *   ┌──────────────┬──────────────────────────────────────┐
 *   │              │  Top bar: toggle / stepper / actions  │
 *   │   SIDEBAR    ├──────────────────────────────────────┤
 *   │  240px/64px  │      MAIN CONTENT (max-width 960px)   │
 *   └──────────────┴──────────────────────────────────────┘
 *
 * The collapse state lives HERE, not in the sidebar, for two reasons: the main
 * content's left padding has to track the rail width or collapsing leaves a
 * dead gap beside it, and the toggle needs one fixed home. A control that
 * collapses from the sidebar header but expands from its footer is a control
 * nobody can find the second time.
 */

const COLLAPSE_KEY = "brains-sidebar-collapsed";

export function AppShell({
  ideas,
  children,
  isOps = false,
  publicWorkspace,
}: {
  ideas: SidebarIdea[];
  children: React.ReactNode;
  isOps?: boolean;
  publicWorkspace?: { token: string; ideaId: string };
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = usePersistedFlag(COLLAPSE_KEY);

  const toggleCollapsed = React.useCallback(
    () => setCollapsed(!collapsed),
    [collapsed, setCollapsed],
  );

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="skip-link type-body-m rounded-[6px] bg-brand px-4 py-2 text-on-accent"
      >
        Skip to content
      </a>

      <Sidebar
        ideas={ideas}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isOps={isOps}
        publicWorkspace={publicWorkspace}
      />

      {/* Padding tracks the rail: the 56px icon rail at tablet, and at desktop
          either that or the full 260px depending on the preference. */}
      <div className={cn("md:pl-14", !collapsed && "lg:pl-[260px]")}>
        {/* No rule under the top bar. The bar and the page are the same
            colour, so a line across the top of every screen was drawing a
            border around nothing; the blur already handles content passing
            underneath it when the page scrolls. */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-page/95 px-4 backdrop-blur-sm sm:px-6">
          {/* Mobile: opens the drawer */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-1 rounded p-1.5 text-secondary transition-colors hover:text-primary md:hidden"
            aria-label="Open navigation"
          >
            <ListIcon size={22} aria-hidden="true" />
          </button>

          {/* Page-specific breadcrumb / stepper / actions are portalled here.
              Account lives in the sidebar footer (§2.2), so the top bar stays
              entirely about where you are in the pipeline. */}
          <div
            id="topbar-slot"
            className="flex min-w-0 flex-1 items-center gap-4"
          />
        </header>

        <main id="main" className="px-4 py-8 sm:px-6 lg:px-8">
          {/* Readable line length beats edge-to-edge density (§1.4) */}
          <div className="mx-auto w-full max-w-[960px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

/**
 * Renders page-specific content into the top bar. Kept as a portal so each
 * page owns its own title/stepper/actions without the shell needing to know
 * about routes.
 *
 * The target only exists after the shell has mounted, so the first render
 * returns null rather than reaching for a node that isn't there yet.
 */
export function TopBar({ children }: { children: React.ReactNode }) {
  // The slot is rendered by the shell above us, so it exists from the client's
  // first commit - read it directly rather than round-tripping through state.
  const target = React.useSyncExternalStore(
    () => () => {},
    () => document.getElementById("topbar-slot"),
    () => null,
  );

  if (!target) return null;
  return createPortal(children, target);
}

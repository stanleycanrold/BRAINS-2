"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusIcon,
  SquaresFourIcon,
  CreditCardIcon,
  SidebarSimpleIcon,
  XIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  SignOutIcon,
  CaretUpDownIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/Logo";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTheme } from "@/components/ThemeProvider";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import {
  STATUS_DOT,
  WORKSPACE_SECTIONS,
  type SidebarIdea,
} from "./workspace";
import { stageForStatus, PIPELINE_STAGES } from "@/lib/domain/types";

/**
 * Design system §2.1–2.2 - persistent left sidebar, not top navigation.
 *
 * Structure follows the pattern the founder already knows from tools of this
 * shape: primary nav at the top, the working record list beneath it, account
 * pinned to the bottom. Two details matter for it to feel right:
 *
 *  · The collapsed rail is NARROW (56px) and shows primary nav only. The ideas
 *    list is hidden entirely rather than squeezed into unlabelled dots - a
 *    truncated list is worse than no list.
 *
 *  · The toggle moves to the top of the rail when collapsed and carries an
 *    active state, so the control that closed the panel is the same control,
 *    in the first place you look, that reopens it.
 */

/** Every icon in the nav is this size. Mixed sizes read as sloppy at a glance. */
const ICON = 18;

/**
 * Shared row geometry.
 *
 * Every row - nav link, theme toggle, account - uses ROW for its padding and
 * SLOT for its leading glyph. The slot is exactly ICON wide and centres its
 * child, so a 24px avatar and an 18px icon share one optical axis instead of
 * sitting 3px apart. Aligning by left edge instead would misalign them by half
 * the size difference, which is what was visibly wrong before.
 */
const ROW =
  "flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 md:justify-center md:px-0";
const SLOT = "flex w-[18px] shrink-0 items-center justify-center";

export type { SidebarIdea } from "./workspace";

export function Sidebar({
  ideas,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileClose,
  isOps = false,
}: {
  ideas: SidebarIdea[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isOps?: boolean;
}) {
  const pathname = usePathname();

  /**
   * Which workspace we are inside, read off the path rather than passed in.
   * Every screen under /ideas/:id belongs to one, and the layout that renders
   * this sidebar does not know which - the route does.
   */
  const currentId = pathname.match(/^\/ideas\/([^/]+)/)?.[1] ?? null;
  const isNewIdea = currentId === "new";
  const workspaceId = isNewIdea ? null : currentId;
  const workspace = ideas.find((i) => i.id === workspaceId) ?? null;

  // A section is reachable once the idea has got that far, matching the rule
  // the pipeline stepper follows: nothing you have reached closes behind you.
  const reachedIndex = workspace
    ? PIPELINE_STAGES.indexOf(stageForStatus(workspace.status))
    : -1;
  const sectionReachable: Record<string, boolean> = {
    "": true,
    "/entry": true,
    "/research": reachedIndex >= 1,
    "/validation": reachedIndex >= 2,
    "/report": reachedIndex >= 3,
    "/versions": true,
  };

  // The rail is narrow at tablet regardless of preference, and at desktop only
  // when collapsed. Expressed in CSS so there's no resize listener, no flash,
  // and no way for the rail and the content padding to disagree.
  const railOnly = collapsed ? "hidden md:flex" : "hidden md:flex lg:hidden";
  const wideOnly = collapsed ? "flex md:hidden" : "flex md:hidden lg:flex";
  const labelOnly = collapsed ? "md:hidden" : "md:hidden lg:inline";
  const flexOnly = collapsed ? "md:hidden" : "md:hidden lg:flex";

  const active = ideas.filter((i) => i.status !== "killed");
  const archived = ideas.filter((i) => i.status === "killed");

  return (
    <>
      {mobileOpen ? (
        <div
          className="animate-fade-in fixed inset-0 z-30 bg-scrim md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-sidebar",
          // Labels in the rail overflow onto the canvas by design.
          "overflow-visible",
          "transition-transform duration-200 ease-out md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "w-[260px] md:w-14",
          !collapsed && "lg:w-[260px]",
        )}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-1 px-3",
            "md:justify-center md:px-0",
            !collapsed && "lg:justify-between lg:px-3",
          )}
        >
          {/* Wide: the lockup, with the toggle at the trailing edge. */}
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            aria-label="BRAINS AI - go to dashboard"
            className={cn("items-center rounded px-1", wideOnly)}
          >
            <Logo size={17} priority />
          </Link>

          <button
            type="button"
            onClick={onMobileClose}
            className="ml-auto rounded-[6px] p-1.5 text-secondary transition-colors hover:bg-wash-hover hover:text-primary md:hidden"
            aria-label="Close navigation"
          >
            <XIcon size={20} aria-hidden="true" />
          </button>

          <RailButton
            tooltip={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapsed}
            // Highlighted while collapsed: it's the one live control in the
            // rail, so it reads as the way back out.
            active={collapsed}
            className={collapsed ? "hidden md:inline-flex" : "hidden lg:inline-flex"}
            ariaExpanded={!collapsed}
            ariaControls="app-sidebar"
          >
            <SidebarSimpleIcon size={ICON} aria-hidden="true" />
          </RailButton>
        </div>

        {/* ── Workspace switcher ─────────────────────────────────────── */}
        <div className="shrink-0 px-3 pb-2 md:px-2 lg:px-3">
          <WorkspaceSwitcher
            ideas={ideas}
            currentId={workspaceId}
            collapsed={collapsed}
            onNavigate={onMobileClose}
          />
        </div>

        {/* ── Primary actions ────────────────────────────────────────── */}
        <div className="shrink-0 space-y-0.5 px-3 pb-2 md:px-2 lg:px-3">
          <Tooltip content={collapsed ? "New idea" : ""} side="right">
            <Link
              href="/ideas/new"
              onClick={onMobileClose}
              title="New idea"
              className={cn(
                ROW,
                "type-body-m font-medium text-primary",
                "transition-colors duration-[120ms] hover:bg-wash-hover",
                !collapsed && "lg:justify-start lg:px-2.5",
              )}
            >
              <span className={SLOT}>
                <PlusIcon
                  size={ICON}
                  weight="bold"
                  className="text-brand"
                  aria-hidden="true"
                />
              </span>
              <span className={labelOnly}>New idea</span>
            </Link>
          </Tooltip>

          {/* Hidden inside a workspace. The portfolio of every idea is the
              opposite of what you want while working in one, and the workspace
              has its own Overview immediately below. "All ideas" in the
              switcher is the way back out. */}
          {workspace ? null : (
            <NavItem
              href="/dashboard"
              icon={<SquaresFourIcon size={ICON} aria-hidden="true" />}
              label="Dashboard"
              labelOnly={labelOnly}
              collapsed={collapsed}
              active={pathname === "/dashboard"}
              onNavigate={onMobileClose}
            />
          )}
        </div>

        {/* ── Scoped nav ─────────────────────────────────────────────────
            Inside a workspace this is that workspace's sections. Outside one
            it falls back to the list of ideas, which is the only place a flat
            list of everything still makes sense. Showing both at once was the
            old behaviour and it meant the nav never told you where you were. */}
        <nav
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-3 pb-2",
            collapsed ? "md:hidden" : "md:hidden lg:block",
          )}
          aria-label={workspace ? "Workspace sections" : "Your ideas"}
        >
          {workspace ? (
            <>
              <SectionLabel>Workspace</SectionLabel>
              <ul className="space-y-px">
                {WORKSPACE_SECTIONS.map((section) => {
                  const href = `/ideas/${workspace.id}${section.slug}`;
                  const reachable = sectionReachable[section.slug] ?? true;
                  const isActive =
                    section.slug === ""
                      ? pathname === `/ideas/${workspace.id}`
                      : pathname.startsWith(href);

                  return (
                    <li key={section.slug}>
                      {reachable ? (
                        <Link
                          href={href}
                          onClick={onMobileClose}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "type-body-m flex h-8 items-center rounded-[6px] px-2.5",
                            "transition-colors duration-[120ms]",
                            isActive
                              ? "bg-wash-hover font-medium text-primary"
                              : "text-secondary hover:bg-wash-hover hover:text-primary",
                          )}
                        >
                          {section.label}
                        </Link>
                      ) : (
                        <span
                          className="type-body-m flex h-8 items-center rounded-[6px] px-2.5 text-tertiary opacity-50"
                          title="Not reached yet"
                        >
                          {section.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <SectionLabel>Ideas</SectionLabel>

              {active.length === 0 ? (
                <p className="type-body-m px-2 py-1 text-tertiary">
                  Nothing here yet.
                </p>
              ) : (
                <ul className="space-y-px">
                  {active.map((idea) => (
                    <IdeaLink
                      key={idea.id}
                      idea={idea}
                      active={pathname.startsWith(`/ideas/${idea.id}`)}
                      onNavigate={onMobileClose}
                    />
                  ))}
                </ul>
              )}

              {archived.length > 0 ? (
                <>
                  <SectionLabel className="mt-5">Archived</SectionLabel>
                  <ul className="space-y-px">
                    {archived.map((idea) => (
                      <IdeaLink
                        key={idea.id}
                        idea={idea}
                        active={pathname.startsWith(`/ideas/${idea.id}`)}
                        onNavigate={onMobileClose}
                      />
                    ))}
                  </ul>
                </>
              ) : null}
            </>
          )}
        </nav>

        {/* Keeps the account block pinned to the bottom in the narrow rail,
            where the ideas list isn't there to push it down. */}
        <div className={cn("flex-1", collapsed ? "md:block" : "md:block lg:hidden")} />

        {/* ── Account ────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-line px-3 py-2 md:px-2 lg:px-3">
          <AccountBlock
            flexOnly={flexOnly}
            railOnly={railOnly}
            onNavigate={onMobileClose}
            isOps={isOps}
          />
        </div>
      </aside>
    </>
  );
}

// ── Pieces ──────────────────────────────────────────────────────────────────

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "type-caption px-2 pt-2 pb-1 text-tertiary uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A square icon button sized for the narrow rail. */
function RailButton({
  children,
  tooltip,
  label,
  onClick,
  active,
  className,
  ariaExpanded,
  ariaControls,
}: {
  children: React.ReactNode;
  tooltip: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
}) {
  return (
    <Tooltip content={tooltip} side="right">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-[8px]",
          "transition-colors duration-[120ms]",
          active
            ? "bg-wash-active text-primary"
            : "text-tertiary hover:bg-wash-hover hover:text-primary",
          className,
        )}
      >
        {children}
        <span className="sr-only">{label}</span>
      </button>
    </Tooltip>
  );
}

function NavItem({
  href,
  icon,
  label,
  labelOnly,
  collapsed,
  active,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  labelOnly: string;
  collapsed: boolean;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Tooltip content={collapsed ? label : ""} side="right">
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={label}
        className={cn(
          ROW,
          "transition-colors duration-[120ms]",
          // Selected state is a neutral seat plus weight - reserving colour
          // for status keeps status meaningful (§1.2).
          active
            ? "bg-wash-active font-medium text-primary"
            : "text-secondary hover:bg-wash-hover hover:text-primary",
          !collapsed && "lg:justify-start lg:px-2.5",
        )}
      >
        <span className={SLOT}>{icon}</span>
        <span className={cn("type-body-m truncate", labelOnly)}>{label}</span>
        <span className="sr-only">{label}</span>
      </Link>
    </Tooltip>
  );
}

function IdeaLink({
  idea,
  active,
  onNavigate,
}: {
  idea: SidebarIdea;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={`/ideas/${idea.id}`}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={idea.title}
        className={cn(
          "flex h-8 items-center gap-2.5 rounded-[8px] px-2.5",
          "transition-colors duration-[120ms]",
          active ? "bg-wash-active" : "hover:bg-wash-hover",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[idea.status])}
        />
        <span
          className={cn(
            "type-body-m min-w-0 flex-1 truncate text-primary",
            active && "font-medium",
          )}
        >
          {idea.title}
        </span>
        {idea.score !== null ? (
          <span className="type-data-s shrink-0 text-tertiary">{idea.score}</span>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * The profile menu.
 *
 * Billing, appearance and sign-out live here rather than in the main nav.
 * Those are all properties of the PERSON, not places in the product - putting
 * them alongside "Dashboard" made the nav look busier than the product is, and
 * pushed the thing founders actually navigate (their ideas) further down.
 */
function AccountBlock({
  flexOnly,
  railOnly,
  onNavigate,
  isOps,
}: {
  flexOnly: string;
  railOnly: string;
  onNavigate: () => void;
  isOps: boolean;
}) {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Dismiss on outside click or Escape - a menu you can't close by looking
  // away is a menu that feels stuck.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Your account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  /**
   * The avatar is rendered here rather than via Clerk's <UserButton>, which
   * ships its own wrapper, trigger padding and focus box - none of which can
   * be pinned from outside. That is what kept knocking it off the icon axis.
   */
  const avatar = (
    <span className="relative flex size-6 shrink-0 overflow-hidden rounded-full bg-inset">
      {user?.imageUrl ? (
        <Image
          src={user.imageUrl}
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full object-cover"
        />
      ) : (
        <span className="type-caption flex size-6 items-center justify-center font-medium text-secondary">
          {initialOf(name)}
        </span>
      )}
    </span>
  );

  return (
    <div ref={ref} className="relative">
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="animate-rise absolute bottom-full left-0 z-50 mb-1.5 w-[232px] overflow-hidden rounded-[10px] border border-line bg-raised p-1 shadow-[var(--shadow-overlay)]"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="type-body-m truncate font-medium text-primary">
              {name}
            </p>
            <p className="type-caption truncate text-tertiary">{email}</p>
          </div>

          <div className="p-1">
            <MenuItem
              icon={<UserIcon size={ICON} aria-hidden="true" />}
              label="Manage profile"
              onClick={() => {
                setOpen(false);
                openUserProfile();
              }}
            />
            <MenuItem
              icon={<CreditCardIcon size={ICON} aria-hidden="true" />}
              label="Plan & billing"
              href="/account"
              onClick={() => {
                setOpen(false);
                onNavigate();
              }}
            />
            <MenuItem
              icon={
                theme === "dark" ? (
                  <SunIcon size={ICON} aria-hidden="true" />
                ) : (
                  <MoonIcon size={ICON} aria-hidden="true" />
                )
              }
              label={theme === "dark" ? "Light mode" : "Dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
          </div>

          {isOps ? (
            <div className="border-t border-line p-1">
              <MenuItem
                icon={<WrenchIcon size={ICON} aria-hidden="true" />}
                label="Ops console"
                href="/ops"
                onClick={() => {
                  setOpen(false);
                  onNavigate();
                }}
              />
            </div>
          ) : null}

          <div className="border-t border-line p-1">
            <MenuItem
              icon={<SignOutIcon size={ICON} aria-hidden="true" />}
              label="Sign out"
              onClick={() => void signOut({ redirectUrl: "/sign-in" })}
            />
          </div>
        </div>
      ) : null}

      {/* Wide: avatar in the shared slot, identity in the text column. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={email || name}
        className={cn(
          ROW,
          "text-left transition-colors hover:bg-wash-hover lg:justify-start lg:px-2.5",
          open && "bg-wash-active",
          flexOnly,
        )}
      >
        <span className={SLOT}>{avatar}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="type-body-m block truncate font-medium text-primary">
            {isLoaded ? name : " "}
          </span>
          <span className="type-caption block truncate text-tertiary">
            {isLoaded ? email || "Free plan" : " "}
          </span>
        </span>
        <CaretUpDownIcon
          size={14}
          className="shrink-0 text-tertiary"
          aria-hidden="true"
        />
      </button>

      {/* Rail: the same row collapsed to the slot. */}
      <Tooltip content={name} side="right">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            ROW,
            "transition-colors hover:bg-wash-hover",
            open && "bg-wash-active",
            railOnly,
          )}
        >
          <span className={SLOT}>{avatar}</span>
          <span className="sr-only">Account</span>
        </button>
      </Tooltip>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  href?: string;
}) {
  const className = cn(
    "flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left",
    "type-body-m text-secondary transition-colors hover:bg-wash-hover hover:text-primary",
  );

  if (href) {
    return (
      <Link href={href} role="menuitem" onClick={onClick} className={className}>
        <span className={SLOT}>{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onClick} className={className}>
      <span className={SLOT}>{icon}</span>
      {label}
    </button>
  );
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

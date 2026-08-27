"use client";

import * as React from "react";
import Link from "next/link";
import {
  CaretUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { STATUS_DOT, STATUS_TEXT, type SidebarIdea } from "./workspace";

/**
 * The workspace switcher, in the shape every tool with projects uses.
 *
 * The sidebar previously listed every idea, always, so navigating meant
 * scanning a list that grows forever and the nav never told you where you
 * were. Selecting a workspace and scoping everything to it is the pattern a
 * founder already knows from Vercel, Linear and GitHub - and it is what makes
 * an idea feel like a place it can grow inside rather than a row in a list.
 *
 * Filtering appears past a handful of ideas. Below that it is a search box
 * over four items, which is furniture.
 */
export function WorkspaceSwitcher({
  ideas,
  currentId,
  collapsed,
  onNavigate,
}: {
  ideas: SidebarIdea[];
  currentId: string | null;
  /** In the narrow rail the trigger is an icon; the panel is unchanged. */
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const root = React.useRef<HTMLDivElement>(null);

  const current = ideas.find((i) => i.id === currentId) ?? null;

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const matches = query.trim()
    ? ideas.filter((i) =>
        i.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : ideas;

  function close() {
    setOpen(false);
    setQuery("");
    onNavigate();
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={current ? current.title : "All ideas"}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-[8px] border border-line px-2.5",
          "text-left transition-colors duration-[120ms] hover:bg-wash-hover",
          collapsed && "md:justify-center md:px-0",
        )}
      >
        <span className="flex w-[18px] shrink-0 items-center justify-center">
          {current ? (
            <span
              className={cn(
                "size-2 rounded-full",
                STATUS_DOT[current.status],
              )}
              aria-hidden="true"
            />
          ) : (
            <SquaresFourIcon size={16} aria-hidden="true" className="text-secondary" />
          )}
        </span>

        <span
          className={cn(
            "type-body-m min-w-0 flex-1 truncate font-medium text-primary",
            collapsed && "md:hidden",
          )}
        >
          {current ? current.title || "Untitled idea" : "All ideas"}
        </span>

        <CaretUpDownIcon
          size={14}
          aria-hidden="true"
          className={cn("shrink-0 text-tertiary", collapsed && "md:hidden")}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-[calc(100%+4px)] left-0 z-50 w-[268px] overflow-hidden",
            "rounded-[10px] border border-line bg-raised shadow-[var(--shadow-overlay)]",
          )}
        >
          {ideas.length > 6 ? (
            <div className="flex items-center gap-2 border-b border-line px-3">
              <MagnifyingGlassIcon
                size={14}
                aria-hidden="true"
                className="shrink-0 text-tertiary"
              />
              {/* Focused on open: the menu was opened deliberately, and typing
                  to filter is the reason to open it once the list is long. */}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find idea..."
                aria-label="Find idea"
                className="type-body-m h-10 w-full bg-transparent text-primary placeholder:text-tertiary focus:outline-none"
              />
            </div>
          ) : null}

          <div className="max-h-[320px] overflow-y-auto p-1.5">
            <Link
              href="/ideas"
              onClick={close}
              role="menuitem"
              className={cn(
                "flex items-center gap-2.5 rounded-[6px] px-2.5 py-2",
                "transition-colors duration-[120ms] hover:bg-wash-hover",
              )}
            >
              <SquaresFourIcon
                size={15}
                aria-hidden="true"
                className="shrink-0 text-secondary"
              />
              <span className="type-body-m flex-1 text-primary">All ideas</span>
              {!currentId ? (
                <CheckIcon size={14} aria-hidden="true" className="text-brand" />
              ) : null}
            </Link>

            {matches.length > 0 ? (
              <div className="mt-1 border-t border-line pt-1">
                {matches.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    onClick={close}
                    role="menuitem"
                    className={cn(
                      "flex items-center gap-2.5 rounded-[6px] px-2.5 py-2",
                      "transition-colors duration-[120ms] hover:bg-wash-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        STATUS_DOT[idea.status],
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="type-body-m block truncate text-primary">
                        {idea.title || "Untitled idea"}
                      </span>
                      <span className="type-caption block text-tertiary">
                        {STATUS_TEXT[idea.status]}
                        {idea.score !== null ? ` · ${idea.score}/100` : ""}
                      </span>
                    </span>
                    {idea.id === currentId ? (
                      <CheckIcon
                        size={14}
                        aria-hidden="true"
                        className="shrink-0 text-brand"
                      />
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="type-body-m px-2.5 py-3 text-tertiary">
                Nothing matches that.
              </p>
            )}
          </div>

          <Link
            href="/ideas/new"
            onClick={close}
            role="menuitem"
            className={cn(
              "flex items-center gap-2.5 border-t border-line px-4 py-3",
              "transition-colors duration-[120ms] hover:bg-wash-hover",
            )}
          >
            <PlusIcon
              size={15}
              weight="bold"
              aria-hidden="true"
              className="shrink-0 text-brand"
            />
            <span className="type-body-m font-medium text-primary">
              New idea
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

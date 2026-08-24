import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useBrains } from "../lib/store";
import { Wordmark } from "./ui";
import { modelFor } from "../lib/store";

const NAV = [
  { to: "/app", label: "Dashboard", num: "01" },
  { to: "/app/engage", label: "Engage", num: "02" },
  { to: "/app/account", label: "Account", num: "03" },
];

function ThemeToggle() {
  const { db, setConfig } = useBrains();
  const dark = db.config.theme === "dark";
  return (
    <button
      onClick={() => setConfig({ theme: dark ? "light" : "dark" })}
      className="btn btn-sm"
      title="Toggle theme — both token sets ship"
      aria-label="Toggle theme"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
        {dark ? (
          <>
            <circle cx="8" cy="8" r="3.2" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" />
          </>
        ) : (
          <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
        )}
      </svg>
      {dark ? "Light" : "Dark"}
    </button>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { db } = useBrains();
  const loc = useLocation();
  const pending = Object.values(db.versions).reduce((n, v) => n + v.responses.filter((r) => r.screened === "pending").length, 0);

  return (
    <div className="min-h-screen md:pl-[232px]">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-[var(--line)] bg-[var(--bg1)] md:flex">
        <div className="border-b border-[var(--line)] p-5">
          <Link to="/">
            <Wordmark />
          </Link>
          <p className="font-mono mt-3 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">Validation engine</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active = n.to === "/app" ? loc.pathname === "/app" || loc.pathname.startsWith("/app/ideas") : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[14px] font-medium transition-colors"
                style={active ? { background: "var(--bg2)", borderColor: "var(--line)", color: "var(--ink)" } : { color: "var(--ink-dim)" }}
              >
                <span className="font-mono text-[10px]" style={{ color: active ? "var(--probe)" : "var(--ink-faint)" }}>
                  {n.num}
                </span>
                {n.label}
                {n.to === "/app/engage" && pending > 0 && (
                  <span className="font-mono ml-auto rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2.5 border-t border-[var(--line)] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Provider</span>
            <span className="chip" style={{ color: "var(--probe)" }}>
              {db.config.provider === "groq" ? "groq" : "anthropic"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Live search</span>
            <span className="chip" style={{ color: db.config.liveSearch ? "var(--go)" : "var(--warn)" }}>
              {db.config.liveSearch ? "on" : "off"}
            </span>
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-[var(--ink-faint)]">
            {modelFor(db.config.provider)} · 9 agents · audit on
          </p>
        </div>
      </aside>

      {/* top bar */}
      <header className="sticky top-0 z-30 flex h-[58px] items-center gap-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_86%,transparent)] px-5 backdrop-blur-md md:px-8">
        <Link to="/" className="md:hidden">
          <Wordmark compact />
        </Link>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-faint)]">
          <span className="text-[var(--ink-dim)]">app</span> / {title}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="chip hidden sm:inline-flex" style={{ color: "var(--go)" }}>
            <span className="dot-live h-1.5 w-1.5 rounded-full" style={{ background: "var(--go)" }} />
            pipeline live
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}

export { ThemeToggle };

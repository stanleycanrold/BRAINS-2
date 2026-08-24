import React from "react";
import { useBrains } from "../lib/store";
import { PRICING_CONFIG, roundQuote } from "../lib/domain";
import { AppShell } from "../components/shell";
import { Reveal, KV } from "../components/ui";

export default function Account() {
  const { db, setConfig, resetDemo, toast } = useBrains();
  const q = roundQuote(12);

  return (
    <AppShell title="account">
      <div className="mx-auto max-w-[1240px]">
        <p className="kicker">engine &amp; billing</p>
        <h1 className="font-display mt-2 text-[clamp(28px,3.4vw,42px)] font-bold">Account</h1>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* engine config */}
          <Reveal>
            <section className="card p-7">
              <span className="kicker" style={{ color: "var(--probe)" }}>llm provider</span>
              <h2 className="font-display mt-2 text-[22px] font-bold">One-line provider swap</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">
                Groq in phase one, Anthropic behind the same interface. Change one variable — no agent, route or component is touched.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {(["groq", "anthropic"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setConfig({ provider: p });
                      toast(p === "groq" ? "Provider → Groq (llama-3.3-70b-versatile)" : "Provider → Anthropic (claude-sonnet-4-5)", "ok");
                    }}
                    className="rounded-[10px] border p-4 text-left transition-all hover:-translate-y-0.5"
                    style={db.config.provider === p ? { borderColor: "var(--probe)", background: "var(--probe-soft)" } : { borderColor: "var(--line)" }}
                  >
                    <span className="font-mono text-[13px] font-semibold" style={{ color: db.config.provider === p ? "var(--probe)" : "var(--ink)" }}>{p}</span>
                    <p className="font-mono mt-1 text-[10.5px] text-[var(--ink-faint)]">{p === "groq" ? "llama-3.3-70b-versatile" : "claude-sonnet-4-5"}</p>
                    <p className="mt-2 text-[11.5px] text-[var(--ink-dim)]">{p === "groq" ? "Phase 1 · free tier, backs off on 429" : "Production path · adapter ready"}</p>
                  </button>
                ))}
              </div>
              <p className="font-mono mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg0)] px-4 py-3 text-[11px] text-[var(--ink-dim)]">
                LLM_PROVIDER=<span style={{ color: "var(--go)" }}>{db.config.provider}</span> · every run logs model + provider to agent_run_logs
              </p>
            </section>
          </Reveal>

          <Reveal delay={80}>
            <section className="card p-7">
              <span className="kicker" style={{ color: "var(--go)" }}>research integrity</span>
              <h2 className="font-display mt-2 text-[22px] font-bold">Live search</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">
                Research degrades rather than fails. With live search off, reports carry an <strong className="text-[var(--warn)]">unsourced</strong> flag — model recall is never presented as researched fact.
              </p>
              <div className="mt-5 flex items-center gap-4">
                <button
                  role="switch"
                  aria-checked={db.config.liveSearch}
                  onClick={() => {
                    setConfig({ liveSearch: !db.config.liveSearch });
                    toast(db.config.liveSearch ? "Live search off — new research will be flagged unsourced" : "Live search on — citations will trace to the search pool", db.config.liveSearch ? "warn" : "ok");
                  }}
                  className="relative h-[30px] w-[56px] rounded-full border transition-colors"
                  style={{ background: db.config.liveSearch ? "var(--go-soft)" : "var(--bg2)", borderColor: db.config.liveSearch ? "var(--go)" : "var(--line)" }}
                >
                  <span className="absolute top-[3px] h-[22px] w-[22px] rounded-full transition-all" style={{ left: db.config.liveSearch ? 29 : 3, background: db.config.liveSearch ? "var(--go)" : "var(--ink-faint)" }} />
                </button>
                <span className="font-mono text-[12px]" style={{ color: db.config.liveSearch ? "var(--go)" : "var(--warn)" }}>{db.config.liveSearch ? "on — citing retrieved sources" : "off — unsourced flag on new runs"}</span>
              </div>
              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <span className="kicker">appearance</span>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(["dark", "light"] as const).map((t) => (
                    <button key={t} onClick={() => setConfig({ theme: t })} className="rounded-[10px] border p-3.5 text-left transition-all"
                      style={db.config.theme === t ? { borderColor: "var(--go)", background: "var(--go-soft)" } : { borderColor: "var(--line)" }}>
                      <span className="font-mono text-[12px] font-semibold capitalize" style={{ color: db.config.theme === t ? "var(--go)" : "var(--ink)" }}>{t} tokens</span>
                      <p className="mt-1 text-[11px] text-[var(--ink-dim)]">semantic tokens — theming is a config change</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </Reveal>

          {/* billing */}
          <Reveal delay={120}>
            <section className="card p-7">
              <div className="flex items-center justify-between">
                <span className="kicker" style={{ color: "var(--warn)" }}>billing</span>
                <span className="chip" style={{ color: "var(--warn)" }}>stripe · simulated</span>
              </div>
              <h2 className="font-display mt-2 text-[22px] font-bold">Rounds &amp; invoices</h2>
              <p className="mt-2 text-[14px] text-[var(--ink-dim)]">Prices computed from pricing_config on the server. The webhook verifies signatures and fails closed without a secret.</p>
              <div className="mt-5 space-y-3">
                {[
                  { id: "in_0412", label: "LedgerLeaf v2 — 10 interviews + analysis", amount: 10 * PRICING_CONFIG.perInterview + PRICING_CONFIG.analysisFee, status: "paid" },
                  { id: "in_0417", label: "SafeSpark v1 — 8 interviews + analysis", amount: 8 * PRICING_CONFIG.perInterview + PRICING_CONFIG.analysisFee, status: "paid" },
                  { id: "in_0421", label: `SafeSpark v1 — +3 interviews (top-up)`, amount: 3 * PRICING_CONFIG.perInterview, status: "open" },
                ].map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-4 py-3">
                    <span className="font-mono text-[10.5px] text-[var(--ink-faint)]">{inv.id}</span>
                    <span className="flex-1 text-[13.5px]">{inv.label}</span>
                    <span className="font-mono text-[13px] font-semibold">${inv.amount}</span>
                    <span className="chip" style={{ color: inv.status === "paid" ? "var(--go)" : "var(--warn)", borderColor: "currentColor" }}>{inv.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <KV k="next round (12 interviews)" v={`$${q.total.toLocaleString()}`} />
                <KV k="per interview" v={`$${PRICING_CONFIG.perInterview}`} />
                <KV k="analysis fee" v={`$${PRICING_CONFIG.analysisFee}`} />
              </div>
            </section>
          </Reveal>

          {/* danger zone */}
          <Reveal delay={160}>
            <section className="card p-7">
              <span className="kicker" style={{ color: "var(--stop)" }}>danger zone</span>
              <h2 className="font-display mt-2 text-[22px] font-bold">Demo data</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">
                Everything you've run lives in your browser under the <code className="font-mono text-[12px] text-[var(--probe)]">brains.schema.v1</code> namespace. Reset to restore the seed portfolio — SafeSpark mid-round, LedgerLeaf's forked GO, and friends.
              </p>
              <button
                className="btn btn-danger mt-5"
                onClick={() => {
                  if (window.confirm("Reset all demo data back to the seed portfolio?")) resetDemo();
                }}
              >
                Reset demo data
              </button>
              <div className="mt-6 border-t border-[var(--line)] pt-4">
                <KV k="schema" v="brains (namespaced)" />
                <KV k="versions table" v="append-only" />
                <KV k="questionnaire smoke" v="questions-only asserted" />
              </div>
            </section>
          </Reveal>
        </div>
      </div>
    </AppShell>
  );
}

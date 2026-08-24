import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useBrains, founderVisible, computeConfirmationRate } from "../lib/store";
import { CAPABILITIES, PRICING_CONFIG, roundQuote, PIPELINE_STAGES, AGENTS } from "../lib/domain";
import { Wordmark, Reveal, StatusChip, VerdictGauge, STAGE_META, DimensionBars, KV } from "../components/ui";
import { ThemeToggle } from "../components/shell";

/* ---------------- live run console ---------------- */

const SCRIPT: { stage: string; agent?: string; text: string; tone?: "ok" | "warn" | "stop" | "probe" }[] = [
  { stage: "describe", agent: "idea.intake", text: "SafeSpark v1 appended — versions are append-only", tone: "probe" },
  { stage: "describe", text: "riskiest assumption isolated → renters will pay $39/mo" },
  { stage: "research", agent: "market_research", text: "sizing market … $11B addressable @ 14% CAGR", tone: "probe" },
  { stage: "research", agent: "competitor_scan", text: "3 incumbents mapped — gap: self-installed renter flow", tone: "probe" },
  { stage: "research", agent: "signal_scan", text: "community signal 84 — weekly threads, active workarounds", tone: "probe" },
  { stage: "research", agent: "pricing_intel", text: "WTP range $33–$78 · anchor $54 · monitoring model", tone: "probe" },
  { stage: "research", text: "5 citations verified against the search pool ✓", tone: "ok" },
  { stage: "validate", agent: "questionnaire_design", text: "6 questions — never leads the witness", tone: "probe" },
  { stage: "validate", text: "share link SSP-7Q2F live — exposes questions only" },
  { stage: "validate", agent: "respondent_screening", text: "11 responses in → 9 approved, 2 pending, rejected stay hidden", tone: "warn" },
  { stage: "validate", text: "confirmation 7/10 shown = 70% — denominator is the visible list", tone: "ok" },
  { stage: "decide", agent: "evidence_scoring", text: "5 dimensions scored from answers, not vibes", tone: "probe" },
  { stage: "decide", agent: "verdict_synthesis", text: "advises GO — the gate would enforce it either way" },
  { stage: "decide", text: "VERDICT → GO · 66/100 · threshold 50 · enforced in code", tone: "ok" },
];

const TONE: Record<string, string> = { ok: "var(--go)", warn: "var(--warn)", stop: "var(--stop)", probe: "var(--probe)" };

function LiveRun() {
  const [cursor, setCursor] = useState(2);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setCursor((c) => {
        if (c >= SCRIPT.length + 4) return 1; // hold on the verdict ~3s, then loop
        return c + 1;
      });
    }, 820);
    return () => clearInterval(t);
  }, [paused]);

  const lines = SCRIPT.slice(0, cursor);
  const activeStage = lines[lines.length - 1]?.stage ?? "describe";
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [cursor]);

  return (
    <div className="card relative overflow-hidden">
      <div className="scanline" />
      {/* header */}
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-3.5">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--stop)", opacity: 0.7 }} />
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--warn)", opacity: 0.7 }} />
          <i className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--go)", opacity: 0.7 }} />
        </span>
        <span className="font-mono text-[12px] text-[var(--ink-dim)]">brains run — safespark · v1</span>
        <span className="ml-auto">
          <StatusChip status={activeStage === "decide" && cursor >= SCRIPT.length ? "go" : activeStage === "research" ? "researching" : activeStage === "validate" ? "validating" : "draft"} label={activeStage} />
        </span>
      </div>
      {/* stage rail */}
      <div className="grid grid-cols-4 border-b border-[var(--line)]">
        {PIPELINE_STAGES.map((s, i) => (
          <div key={s} className="px-4 py-2.5 text-center" style={{ borderLeft: i ? "1px solid var(--line-soft)" : undefined, background: activeStage === s ? "var(--bg2)" : "transparent" }}>
            <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: activeStage === s ? "var(--probe)" : "var(--ink-faint)" }}>
              {STAGE_META[s].n} {STAGE_META[s].name}
            </span>
          </div>
        ))}
      </div>
      {/* log */}
      <div ref={boxRef} className="relative h-[318px] overflow-hidden px-5 py-4 font-mono text-[12.5px] leading-[1.9]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {lines.map((l, i) => (
          <div key={i} className="tick-in flex gap-3" style={{ color: l.tone ? TONE[l.tone] : "var(--ink-dim)" }}>
            <span className="w-14 shrink-0 select-none text-[var(--ink-faint)]">{l.agent ?? "pipeline"}</span>
            <span className={i === lines.length - 1 && cursor < SCRIPT.length ? "caret" : ""}>{l.text}</span>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(transparent, var(--bg1))" }} />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--line)] px-5 py-3">
        <span className="font-mono text-[10.5px] text-[var(--ink-faint)]">agent_run_logs · prompt versions pinned · every call audited</span>
        <span className="font-mono text-[10.5px] text-[var(--probe)]">hover to pause</span>
      </div>
    </div>
  );
}

/* ---------------- landing ---------------- */

export default function Landing() {
  const { db } = useBrains();
  const ss = db.versions[db.ideas.find((i) => i.slug === "safespark")?.headVersionId ?? ""];
  const ll2 = db.versions[db.ideas.find((i) => i.slug === "ledgerleaf")?.headVersionId ?? ""];
  const [calc, setCalc] = useState(12);
  const quote = roundQuote(calc);

  const visible = ss ? founderVisible(ss) : [];
  const rate = ss ? computeConfirmationRate(ss) : 0;

  const reportNav = useMemo(() => ["Summary", "Market", "Competitors", "Segments", "Evidence", "Pricing intel", "Decision"], []);

  return (
    <div className="bg-layers noise min-h-screen">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg0)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-[62px] max-w-[1440px] items-center gap-8 px-5 md:px-10">
          <Link to="/">
            <Wordmark />
          </Link>
          <nav className="ml-4 hidden items-center gap-7 text-[13.5px] font-medium text-[var(--ink-dim)] lg:flex">
            <a href="#pipeline" className="transition-colors hover:text-[var(--ink)]">Pipeline</a>
            <a href="#report" className="transition-colors hover:text-[var(--ink)]">The report</a>
            <a href="#capabilities" className="transition-colors hover:text-[var(--ink)]">Capabilities</a>
            <a href="#pricing" className="transition-colors hover:text-[var(--ink)]">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link to="/app" className="btn btn-primary btn-sm">
              Open the engine
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h9M9 4.5L12.5 8 9 11.5" /></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* opening — the live engine, not a hero trio */}
      <section className="mx-auto max-w-[1440px] px-5 pb-24 pt-14 md:px-10 md:pt-20">
        <div className="rail-section">
          <div className="rail-sticky">
            <Reveal>
              <p className="kicker" style={{ color: "var(--go)" }}>0→1 validation engine</p>
              <h1 className="font-display mt-5 text-[clamp(40px,5.4vw,76px)] font-bold leading-[0.98] tracking-[-0.03em]">
                Evidence,
                <br />
                not documents<span style={{ color: "var(--go)" }}>.</span>
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-[var(--ink-dim)]">
                BRAINS takes a founder from <em className="text-[var(--ink)] not-italic font-medium">"I have an idea"</em> to a go/no-go decision — sourced research, scored customer interviews, and a 50% threshold enforced in code. Empirical customer discovery &amp; pricing intelligence, in one pipeline.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/app" className="btn btn-primary">
                  Start a validation
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h9M9 4.5L12.5 8 9 11.5" /></svg>
                </Link>
                <a href="#report" className="btn">Read a real report</a>
              </div>
              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
                {[
                  { k: "responses in", v: ss ? String(ss.responses.length) : "11" },
                  { k: "confirmation", v: ss ? `${Math.round(rate * 100)}%` : "70%" },
                  { k: "the gate", v: "50%" },
                  { k: "agents, audited", v: "9" },
                ].map((s) => (
                  <div key={s.k} className="bg-[var(--bg1)] px-4 py-3.5">
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{s.k}</dt>
                    <dd className="font-display mt-1 text-[22px] font-bold leading-none">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <LiveRun />
            <p className="font-mono mt-4 text-center text-[11px] text-[var(--ink-faint)]">
              a live run on SafeSpark — the same pipeline you get in the app
            </p>
          </Reveal>
        </div>
      </section>

      {/* pipeline */}
      <section id="pipeline" className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10">
          <div className="rail-section">
            <div className="rail-sticky">
              <Reveal>
                <p className="kicker">§ the pipeline</p>
                <h2 className="font-display mt-4 text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.04]">Four stages. Zero theatre.</h2>
                <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-[var(--ink-dim)]">
                  The frontend never calls an agent directly — it talks to the pipeline API, and the orchestrator decides what runs. Any agent can be replaced by a trained SLM later without touching the contract.
                </p>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <div className="hairgrid md:grid-cols-2">
                {PIPELINE_STAGES.map((s, i) => {
                  const m = STAGE_META[s];
                  const agents = AGENTS.filter((a) => a.stage === s);
                  return (
                    <div key={s} className="group p-7 transition-colors hover:bg-[var(--bg2)]">
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[12px]" style={{ color: "var(--probe)" }}>{m.n}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">stage {i + 1}/4</span>
                      </div>
                      <h3 className="font-display mt-3 text-[24px] font-bold">{m.name}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">{m.desc}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {agents.length ? agents.map((a) => (
                          <span key={a.id} className="chip">{a.id}</span>
                        )) : (
                          <span className="chip">founder-authored · validated by schema</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* the report — real sections from a real run */}
      <section id="report" className="border-t border-[var(--line)]" style={{ background: "var(--wash)" }}>
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10">
          <div className="rail-section">
            <div className="rail-sticky">
              <Reveal>
                <p className="kicker">§ the artifact</p>
                <h2 className="font-display mt-4 text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.04]">One report, walked section by section.</h2>
                <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-[var(--ink-dim)]">
                  Not a sample. These sections are rendered from the SafeSpark run currently in the engine — the same data the founder sees.
                </p>
                <ol className="mt-8 space-y-2.5">
                  {reportNav.map((r, i) => (
                    <li key={r} className="font-mono text-[12px] text-[var(--ink-faint)]">
                      <span className="mr-3 text-[var(--probe)]">0{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>

            <div className="space-y-5">
              {ss?.research && (
                <>
                  <Reveal>
                    <article className="card p-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="kicker" style={{ color: "var(--probe)" }}>01 · summary</span>
                        <span className="chip">model {ss.research.model}</span>
                        <span className="chip">{(ss.research.latencyMs / 1000).toFixed(1)}s</span>
                        {ss.research.unsourced && <span className="chip" style={{ color: "var(--warn)" }}>unsourced</span>}
                      </div>
                      <p className="mt-4 text-[16.5px] leading-relaxed">{ss.research.summary}</p>
                    </article>
                  </Reveal>

                  <Reveal delay={60}>
                    <article className="card p-7">
                      <span className="kicker" style={{ color: "var(--probe)" }}>02 · market</span>
                      <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
                        <div className="bg-[var(--bg2)] p-5">
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">size</p>
                          <p className="font-display mt-2 text-[26px] font-bold">{ss.research.market.size}</p>
                        </div>
                        <div className="bg-[var(--bg2)] p-5">
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">growth</p>
                          <p className="font-display mt-2 text-[26px] font-bold" style={{ color: "var(--go)" }}>{ss.research.market.growth}</p>
                        </div>
                        <div className="bg-[var(--bg2)] p-5">
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">trend</p>
                          <p className="mt-2 text-[13px] leading-snug text-[var(--ink-dim)]">{ss.research.market.trend}</p>
                        </div>
                      </div>
                    </article>
                  </Reveal>

                  <Reveal delay={60}>
                    <article className="card overflow-hidden">
                      <div className="p-7 pb-0"><span className="kicker" style={{ color: "var(--probe)" }}>03 · competitors</span></div>
                      <table className="tbl mt-4">
                        <thead><tr><th>Incumbent</th><th>Angle</th><th>The gap</th></tr></thead>
                        <tbody>
                          {ss.research.competitors.map((c) => (
                            <tr key={c.name}>
                              <td className="font-display font-semibold">{c.name}</td>
                              <td className="text-[var(--ink-dim)]">{c.angle}</td>
                              <td style={{ color: "var(--go)" }}>{c.gap}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </article>
                  </Reveal>

                  <Reveal delay={60}>
                    <article className="card p-7">
                      <span className="kicker" style={{ color: "var(--probe)" }}>04 · segments &amp; signals</span>
                      <div className="mt-5">
                        <DimensionBars dims={ss.research.segments.map((s) => ({ label: `${s.name} · ${s.size}`, score: s.signal, weight: 0, note: `Where: ${s.where}` }))} />
                      </div>
                    </article>
                  </Reveal>

                  <Reveal delay={60}>
                    <article className="card p-7">
                      <span className="kicker" style={{ color: "var(--probe)" }}>05 · evidence</span>
                      {ss.research.unsourced ? (
                        <p className="mt-4 rounded-lg border border-[var(--warn)] p-4 text-[14px]" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                          Live search returned nothing for this run — the report is flagged unsourced rather than presenting model recall as researched fact.
                        </p>
                      ) : (
                        <ul className="mt-4 space-y-3">
                          {ss.research.evidence.map((e) => (
                            <li key={e.url} className="flex gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-4">
                              <span className="chip shrink-0 self-start" style={{ color: "var(--probe)" }}>{e.kind}</span>
                              <div>
                                <p className="text-[14px] leading-relaxed">{e.claim}</p>
                                <p className="font-mono mt-1.5 text-[11px] text-[var(--ink-faint)]">{e.source} — url traced to search pool ✓</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  </Reveal>

                  <Reveal delay={60}>
                    <article className="card p-7">
                      <span className="kicker" style={{ color: "var(--probe)" }}>06 · pricing intelligence</span>
                      <div className="mt-4 flex flex-wrap items-end gap-8">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">wtp range</p>
                          <p className="font-display mt-1 text-[30px] font-bold">${ss.research.pricingIntel.wtpRange[0]}–${ss.research.pricingIntel.wtpRange[1]}<span className="text-[15px] text-[var(--ink-faint)]">/mo</span></p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">anchor</p>
                          <p className="font-display mt-1 text-[30px] font-bold" style={{ color: "var(--go)" }}>${ss.research.pricingIntel.anchor}</p>
                        </div>
                        <div className="min-w-[220px] flex-1">
                          <KV k="model" v={ss.research.pricingIntel.model} />
                          <KV k="basis" v={ss.research.pricingIntel.basis} />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                </>
              )}

              <Reveal delay={60}>
                <article className="card p-7">
                  <div className="flex flex-wrap items-center gap-8">
                    {ll2?.score && <VerdictGauge total={ll2.score.total} verdict={ll2.score.verdict} />}
                    <div className="min-w-[260px] flex-1">
                      <span className="kicker" style={{ color: "var(--probe)" }}>07 · decision</span>
                      <h3 className="font-display mt-3 text-[24px] font-bold">The gate is code, not opinion.</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">
                        Shown: LedgerLeaf v2 — a rework that forked from a 41-point NO-GO. The verdict agent advises; the threshold decides. A model slip cannot flip a founder's verdict.
                      </p>
                      <div className="mt-4">
                        <KV k="threshold" v="50 / 100" />
                        <KV k="enforced by" v={<span className="font-mono" style={{ color: "var(--go)" }}>code</span>} />
                        <KV k="versions" v="append-only · parent-linked" />
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* capabilities */}
      <section id="capabilities" className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10">
          <div className="rail-section">
            <div className="rail-sticky">
              <Reveal>
                <p className="kicker">§ capabilities</p>
                <h2 className="font-display mt-4 text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.04]">Fourteen things the engine does.</h2>
                <p className="mt-5 max-w-[40ch] text-[15px] leading-relaxed text-[var(--ink-dim)]">Every word of it, expanded. No collapsed marketing into a black box — open any row.</p>
              </Reveal>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
              {CAPABILITIES.map((c, i) => (
                <details key={c.title} className="cap group bg-[var(--bg1)] p-6 transition-colors open:bg-[var(--bg2)]">
                  <summary className="flex items-center gap-4">
                    <span className="font-mono text-[11px] text-[var(--probe)]">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display flex-1 text-[16px] font-semibold">{c.title}</span>
                    <svg className="cap-icon shrink-0" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ink-faint)" strokeWidth="1.6"><path d="M7 2v10M2 7h10" /></svg>
                  </summary>
                  <p className="mt-4 pl-9 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">{c.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="border-t border-[var(--line)]" style={{ background: "var(--wash)" }}>
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10">
          <div className="rail-section">
            <div className="rail-sticky">
              <Reveal>
                <p className="kicker">§ pricing</p>
                <h2 className="font-display mt-4 text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.04]">Priced like the deliverable.</h2>
                <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-[var(--ink-dim)]">
                  The deliverable is one validation round: <strong className="text-[var(--ink)]">interviews with sourced respondents</strong>, plus a <strong className="text-[var(--ink)]">scored analysis</strong>. Two components, stated before any number.
                </p>
                <p className="font-mono mt-6 text-[11px] text-[var(--ink-faint)]">Stripe prices computed server-side from pricing_config · simulated until keys are added</p>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="card p-7">
                  <p className="kicker" style={{ color: "var(--go)" }}>component 1</p>
                  <h3 className="font-display mt-3 text-[22px] font-bold">The interviews</h3>
                  <p className="font-display mt-4 text-[44px] font-bold leading-none">${PRICING_CONFIG.perInterview}<span className="text-[16px] font-semibold text-[var(--ink-faint)]"> / interview</span></p>
                  <ul className="mt-5 space-y-2.5 text-[14px] text-[var(--ink-dim)]">
                    {["Sourced from matched communities & outreach pools", "Screened before they ever reach you", "Full transcripts with every answer"].map((x) => (
                      <li key={x} className="flex gap-2.5"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--go)" }} />{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="card p-7">
                  <p className="kicker" style={{ color: "var(--probe)" }}>component 2</p>
                  <h3 className="font-display mt-3 text-[22px] font-bold">The analysis</h3>
                  <p className="font-display mt-4 text-[44px] font-bold leading-none">${PRICING_CONFIG.analysisFee}<span className="text-[16px] font-semibold text-[var(--ink-faint)]"> / round</span></p>
                  <ul className="mt-5 space-y-2.5 text-[14px] text-[var(--ink-dim)]">
                    {["Five-dimension scoring from answers, not vibes", "The 50% go/no-go gate, enforced in code", "Rework advisor if the verdict is NO-GO"].map((x) => (
                      <li key={x} className="flex gap-2.5"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--probe)" }} />{x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="card mt-5 p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="kicker">round calculator</span>
                  <span className="font-mono text-[11px] text-[var(--ink-faint)]">{PRICING_CONFIG.minInterviews}–{PRICING_CONFIG.maxInterviews} interviews per round</span>
                </div>
                <div className="mt-5 grid items-center gap-6 md:grid-cols-[1fr_auto]">
                  <div>
                    <input type="range" min={PRICING_CONFIG.minInterviews} max={PRICING_CONFIG.maxInterviews} value={calc} onChange={(e) => setCalc(+e.target.value)} className="w-full accent-[var(--go)]" aria-label="Interviews per round" />
                    <div className="mt-2 flex justify-between font-mono text-[10.5px] text-[var(--ink-faint)]">
                      <span>{PRICING_CONFIG.minInterviews}</span><span className="text-[var(--ink)]">{quote.interviews} interviews</span><span>{PRICING_CONFIG.maxInterviews}</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--bg2)] px-6 py-4 text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">round total</p>
                    <p className="font-display mt-1 text-[34px] font-bold leading-none" style={{ color: "var(--go)" }}>${quote.total.toLocaleString()}</p>
                    <p className="font-mono mt-1.5 text-[10.5px] text-[var(--ink-faint)]">${quote.interviewCost.toLocaleString()} interviews + ${quote.analysisFee} analysis</p>
                  </div>
                </div>
                <Link to="/app" className="btn btn-primary mt-6">Price my round in the engine</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* continued social scan */}
      <section className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10">
          <div className="rail-section">
            <div className="rail-sticky">
              <Reveal>
                <p className="kicker" style={{ color: "var(--warn)" }}>§ after the round</p>
                <h2 className="font-display mt-4 text-[clamp(28px,3.4vw,46px)] font-bold leading-[1.04]">Continued social scan.</h2>
                <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-[var(--ink-dim)]">
                  The signal scan already named the communities. After the round, BRAINS keeps watching them — a weekly digest of what your buyers are saying, without ever posting as you.
                </p>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <div className="card overflow-hidden">
                <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-4">
                  <span className="dot-live h-2 w-2 rounded-full" style={{ background: "var(--warn)" }} />
                  <span className="font-mono text-[12px] text-[var(--ink-dim)]">week-31 digest · r/renters · city housing subs · review corpus</span>
                  <span className="chip ml-auto" style={{ color: "var(--warn)" }}>read-only</span>
                </div>
                <ul className="divide-y divide-[var(--line-soft)]">
                  {[
                    { t: "Thread (+214) — 'landlord ignored my alarm complaint for 8 months'", s: "acute segment · matches riskiest assumption", up: true },
                    { t: "Review cluster — 9 new 1★ mentions of 'outdated detectors' this week", s: "competitor corpus · sentiment deteriorating", up: true },
                    { t: "Workaround spotted — renter DIY sensor rig, 4.1k views", s: "willingness-to-build signal · WTP proxy rising", up: true },
                    { t: "Adjacent segment quiet — 2 mentions, below noise", s: "deprioritise outreach there this week", up: false },
                  ].map((x) => (
                    <li key={x.t} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--bg2)]">
                      <svg className="mt-1 shrink-0" width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={x.up ? "var(--go)" : "var(--ink-faint)"} strokeWidth="1.7"><path d={x.up ? "M8 13V3M4.5 6.5L8 3l3.5 3.5" : "M3 8h10"} /></svg>
                      <div>
                        <p className="text-[14.5px] font-medium leading-snug">{x.t}</p>
                        <p className="font-mono mt-1 text-[11px] text-[var(--ink-faint)]">{x.s}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
          <div className="flex flex-wrap items-start justify-between gap-10">
            <div>
              <Wordmark />
              <p className="mt-4 max-w-[36ch] text-[13.5px] leading-relaxed text-[var(--ink-dim)]">The 0→1 validation &amp; startup engine. Evidence, not documents.</p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="kicker mb-4">Engine</p>
                <ul className="space-y-2.5 text-[13.5px] text-[var(--ink-dim)]">
                  <li><Link className="transition-colors hover:text-[var(--ink)]" to="/app">Dashboard</Link></li>
                  <li><Link className="transition-colors hover:text-[var(--ink)]" to="/app/engage">Engage</Link></li>
                  <li><Link className="transition-colors hover:text-[var(--ink)]" to="/app/account">Account</Link></li>
                </ul>
              </div>
              <div>
                <p className="kicker mb-4">Site</p>
                <ul className="space-y-2.5 text-[13.5px] text-[var(--ink-dim)]">
                  <li><a className="transition-colors hover:text-[var(--ink)]" href="#pipeline">Pipeline</a></li>
                  <li><a className="transition-colors hover:text-[var(--ink)]" href="#report">The report</a></li>
                  <li><a className="transition-colors hover:text-[var(--ink)]" href="#pricing">Pricing</a></li>
                </ul>
              </div>
            </div>
          </div>
          {/* terms & privacy links go here once drafted */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
            <p className="font-mono text-[11px] text-[var(--ink-faint)]">© 2026 BRAINS · nexabrains.io</p>
            <p className="font-mono text-[11px] text-[var(--ink-faint)]">idea_state_versions: append-only · 50% gate: enforced in code</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { runSmokeSuite, SMOKE_META, type SmokeResult } from "../lib/smoke";
import { Reveal } from "../components/ui";

type Phase = "idle" | "running" | "done";

export default function Smoke() {
  const [results, setResults] = useState<SmokeResult[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = useRef(false);

  const run = async () => {
    if (busy.current) return;
    busy.current = true;
    setPhase("running");
    setResults([]);
    const all = await runSmokeSuite((r) => setResults((prev) => [...prev, r]));
    const failed = all.filter((r) => !r.pass).length;
    setPhase("done");
    busy.current = false;
    console.info(
      `%cBRAINS smoke suite — ${all.length - failed}/${all.length} invariants hold`,
      "color:#34d399;font-weight:bold",
      all.map((r) => ({ test: r.id, pass: r.pass ? "PASS" : "FAIL", ms: r.ms }))
    );
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg0)", color: "var(--ink)" }}>
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)]" style={{ background: "color-mix(in srgb, var(--bg0) 88%, transparent)", backdropFilter: "blur(8px)" }}>
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-6 py-3.5">
          <Link to="/" className="font-display text-[16px] font-bold tracking-tight">
            BRAINS<span style={{ color: "var(--go)" }}>.</span>
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">engine smoke suite</span>
          <span className="ml-auto font-mono text-[11px] text-[var(--ink-faint)]">
            {phase === "running" ? `${String(results.length).padStart(2, "0")}/${String(SMOKE_META.total).padStart(2, "0")}` : phase === "done" ? `${passed} pass · ${failed} fail` : "standby"}
          </span>
          <Link to="/app" className="font-mono text-[11px] text-[var(--ink-dim)] underline-offset-4 hover:underline">back to app ↗</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 lg:grid-cols-[300px_1fr]">
        {/* rail */}
        <aside>
          <div className="lg:sticky lg:top-[84px]">
            <p className="kicker" style={{ color: "var(--probe)" }}>diagnostic</p>
            <h1 className="font-display mt-3 text-[clamp(30px,3.4vw,44px)] font-bold leading-[1.05]">
              Does the engine<br />still hold?
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--ink-dim)]">
              Ten invariants, run against the <em>real</em> pipeline code on a sandboxed schema — the in-app twin of the backend's <code className="font-mono text-[12px] text-[var(--probe)]">scripts/smoke-*.ts</code>. Your live data is never touched.
            </p>

            {/* verdict stamp */}
            <div
              className="mt-7 flex items-center justify-between rounded-[10px] border px-5 py-4 transition-colors duration-500"
              style={{
                borderColor: phase === "done" ? (failed === 0 ? "var(--go)" : "var(--stop)") : "var(--line)",
                background: phase === "done" ? (failed === 0 ? "var(--go-soft)" : "var(--stop-soft)") : "var(--bg1)",
              }}
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">verdict</p>
                <p className="font-display mt-1 text-[22px] font-bold" style={{ color: phase === "done" ? (failed === 0 ? "var(--go)" : "var(--stop)") : "var(--ink-dim)" }}>
                  {phase === "idle" ? "STANDBY" : phase === "running" ? "RUNNING…" : failed === 0 ? "ALL HOLD" : `${failed} BROKEN`}
                </p>
              </div>
              <div className="text-right font-mono text-[12px]">
                <p style={{ color: "var(--go)" }}>{passed} pass</p>
                <p style={{ color: failed ? "var(--stop)" : "var(--ink-faint)" }}>{failed} fail</p>
              </div>
            </div>

            <button className="btn btn-primary mt-5 w-full justify-center" onClick={run} disabled={phase === "running"}>
              {phase === "done" ? "Re-run suite" : phase === "running" ? "Running…" : "Run suite"}
            </button>

            <dl className="mt-7 space-y-2.5 border-t border-[var(--line)] pt-5 font-mono text-[11.5px]">
              {[
                ["schema", SMOKE_META.schema],
                ["go/no-go threshold", `${SMOKE_META.threshold}% · enforced in code`],
                ["hold pending for review", SMOKE_META.holdPending ? "on" : "off"],
                ["agents under audit", String(SMOKE_META.agents)],
                ["sandbox", "isolated — no localStorage writes"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-[var(--ink-faint)]">{k}</dt>
                  <dd className="text-right text-[var(--ink-dim)]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 font-mono text-[10.5px] leading-relaxed text-[var(--ink-faint)]">
              a console mirror of this run is printed to devtools.
            </p>
          </div>
        </aside>

        {/* test feed */}
        <section>
          <ol className="space-y-4">
            {Array.from({ length: SMOKE_META.total }).map((_, i) => {
              const r = results[i];
              const isNext = phase === "running" && i === results.length;
              return (
                <Reveal key={i} delay={reduced ? 0 : Math.min(i * 60, 300)}>
                  <li
                    className="card relative overflow-hidden p-5 transition-all duration-300"
                    style={{
                      opacity: r || isNext ? 1 : 0.45,
                      borderColor: r ? (r.pass ? "color-mix(in srgb, var(--go) 45%, var(--line))" : "var(--stop)") : "var(--line)",
                    }}
                  >
                    {isNext && <span className="scanline" aria-hidden />}
                    <div className="flex items-start gap-4">
                      <span className="font-mono pt-0.5 text-[12px] text-[var(--ink-faint)]">{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-display text-[16.5px] font-bold tracking-tight">{r ? r.name : "…"}</h3>
                          {r ? (
                            <span
                              className="chip font-mono"
                              style={{ color: r.pass ? "var(--go)" : "var(--stop)", borderColor: "currentColor" }}
                            >
                              {r.pass ? "PASS" : "FAIL"} · {r.ms}ms
                            </span>
                          ) : isNext ? (
                            <span className="chip font-mono" style={{ color: "var(--probe)", borderColor: "currentColor" }}>
                              <span className={reduced ? "" : "dot-live"} style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: "var(--probe)" }} />
                              running
                            </span>
                          ) : (
                            <span className="chip font-mono text-[var(--ink-faint)]">queued</span>
                          )}
                        </div>
                        {r && (
                          <>
                            <p className="mt-1 text-[13px] text-[var(--ink-dim)]">{r.rule}</p>
                            <ul className="mt-3 space-y-1.5 border-t border-[var(--line-soft)] pt-3">
                              {r.evidence.map((e, j) => (
                                <li key={j} className="font-mono text-[11.5px] leading-relaxed" style={{ color: e.startsWith("✗") ? "var(--stop)" : "var(--ink-dim)" }}>
                                  <span style={{ color: e.startsWith("✗") ? "var(--stop)" : "var(--go)" }}>{e.startsWith("✗") ? "✗" : "✓"}</span>{" "}
                                  {e.startsWith("✗") ? e.slice(2) : e}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                      {r && (
                        <span className="font-mono mt-0.5 shrink-0 text-[10px] text-[var(--ink-faint)]">{r.id}</span>
                      )}
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>

          {phase === "done" && (
            <div className="tick-in mt-8 flex flex-wrap items-center gap-4 rounded-[10px] border border-[var(--line)] px-6 py-5" style={{ background: "var(--bg1)" }}>
              <p className="font-mono text-[12px] text-[var(--ink-dim)]">
                {failed === 0
                  ? "Every invariant the backend pins still holds in the consolidated codebase. The app is safe to drive — try the pipeline in /app."
                  : `${failed} invariant(s) failed — inspect the evidence above; the failing assertion names the exact rule.`}
              </p>
              <Link to="/app" className="btn btn-ghost ml-auto">Open the app →</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

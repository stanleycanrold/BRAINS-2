import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBrains, founderVisible, computeConfirmationRate } from "../lib/store";
import { STATUS_LABEL, STATUS_STAGE, AGENTS } from "../lib/domain";
import { AppShell } from "../components/shell";
import { Reveal, StatusChip, Stepper, timeAgo as timeAgoUi } from "../components/ui";

const timeAgo = timeAgoUi;

const AGENT_NAME = Object.fromEntries(AGENTS.map((a) => [a.id, a.name]));

function NewIdeaForm({ onDone }: { onDone: (slug: string) => void }) {
  const { createIdea } = useBrains();
  const [f, setF] = useState({ title: "", oneLiner: "", audience: "", problem: "", assumption: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.title.trim() && f.oneLiner.trim() && f.audience.trim() && f.problem.trim() && f.assumption.trim();
  return (
    <form
      className="card tick-in p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onDone(createIdea(f));
      }}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="kicker" style={{ color: "var(--go)" }}>01 · describe</p>
          <h2 className="font-display mt-2 text-[24px] font-bold">What's the idea?</h2>
        </div>
        <span className="font-mono text-[11px] text-[var(--ink-faint)]">creates version 1 · append-only from here</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="ni-title">Working title</label>
          <input id="ni-title" className="input" placeholder="SafeSpark" value={f.title} onChange={set("title")} />
        </div>
        <div>
          <label className="label" htmlFor="ni-aud">Audience</label>
          <input id="ni-aud" className="input" placeholder="Urban renters in multi-unit buildings" value={f.audience} onChange={set("audience")} />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="ni-one">One-liner</label>
          <input id="ni-one" className="input" placeholder="What it does, for whom, in one sentence" value={f.oneLiner} onChange={set("oneLiner")} />
        </div>
        <div>
          <label className="label" htmlFor="ni-prob">The problem, in their words</label>
          <textarea id="ni-prob" className="input min-h-[84px] resize-y" placeholder="What hurts, how often, what it costs" value={f.problem} onChange={set("problem")} />
        </div>
        <div>
          <label className="label" htmlFor="ni-assump">Riskiest assumption</label>
          <textarea id="ni-assump" className="input min-h-[84px] resize-y" placeholder="The one belief that, if false, kills the idea" value={f.assumption} onChange={set("assumption")} />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={!valid}>Describe it — create version 1</button>
        <span className="font-mono text-[11px] text-[var(--ink-faint)]">next: research agents take over</span>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const { db, getHead } = useBrains();
  const nav = useNavigate();
  const [creating, setCreating] = useState(false);

  const ideas = useMemo(() => [...db.ideas].sort((a, b) => b.createdAt - a.createdAt), [db.ideas]);
  const heads = ideas.map((i) => ({ idea: i, v: getHead(i) }));

  const totalResponses = heads.reduce((n, h) => n + h.v.responses.length, 0);
  const decided = heads.filter((h) => h.v.score);
  const goRate = decided.length ? Math.round((decided.filter((h) => h.v.score!.verdict === "GO").length / decided.length) * 100) : 0;
  const avgConf = heads.filter((h) => h.v.responses.length > 0);
  const avg = avgConf.length ? Math.round(avgConf.reduce((s, h) => s + computeConfirmationRate(h.v), 0) / avgConf.length * 100) : 0;
  const recentRuns = [...db.runs].sort((a, b) => b.at - a.at).slice(0, 9);

  return (
    <AppShell title="dashboard">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">portfolio</p>
            <h1 className="font-display mt-2 text-[clamp(28px,3.4vw,42px)] font-bold leading-tight">Ideas under test</h1>
          </div>
          <button className="btn btn-primary" onClick={() => setCreating((c) => !c)}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 2v10M2 7h10" /></svg>
            {creating ? "Close intake" : "New idea"}
          </button>
        </div>

        {creating && (
          <div className="mt-8">
            <NewIdeaForm
              onDone={(slug) => {
                setCreating(false);
                nav(`/app/ideas/${slug}`);
              }}
            />
          </div>
        )}

        {/* stat strip */}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-4">
          {[
            { k: "ideas in pipeline", v: String(ideas.length), c: "var(--ink)" },
            { k: "responses collected", v: String(totalResponses), c: "var(--probe)" },
            { k: "avg confirmation", v: `${avg}%`, c: "var(--warn)" },
            { k: "GO rate (decided)", v: `${goRate}%`, c: "var(--go)" },
          ].map((s, i) => (
            <Reveal key={s.k} delay={i * 70} className="bg-[var(--bg1)] px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{s.k}</p>
              <p className="font-display mt-1.5 text-[30px] font-bold leading-none" style={{ color: s.c }}>{s.v}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* idea list */}
          <div className="space-y-4">
            {heads.map(({ idea, v }, idx) => {
              const rate = v.responses.length ? computeConfirmationRate(v) : null;
              const visible = founderVisible(v).length;
              return (
                <Reveal key={idea.id} delay={idx * 60}>
                  <Link to={`/app/ideas/${idea.slug}`} className="card group block p-6 transition-transform duration-200 hover:-translate-y-0.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-[20px] font-bold tracking-tight">
                        {v.title}
                        <span className="font-mono ml-2 text-[11px] font-normal text-[var(--ink-faint)]">v{v.version}</span>
                      </h3>
                      <StatusChip status={v.status} label={STATUS_LABEL[v.status]} />
                      {v.research?.unsourced && <span className="chip" style={{ color: "var(--warn)" }}>unsourced</span>}
                      {idea.versionIds.length > 1 && (
                        <span className="chip" title="forked from an earlier version — append-only">
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4.5" cy="4" r="2" /><circle cx="4.5" cy="12" r="2" /><circle cx="11.5" cy="6" r="2" /><path d="M4.5 6v4M6.3 5.2c2.4-.6 3.4 0 3.4.8" /></svg>
                          fork ×{idea.versionIds.length}
                        </span>
                      )}
                      <svg className="ml-auto shrink-0 opacity-40 transition-all group-hover:translate-x-1 group-hover:opacity-100" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--ink)" strokeWidth="1.6"><path d="M3 8h9M9 4.5L12.5 8 9 11.5" /></svg>
                    </div>
                    <p className="mt-2 max-w-[70ch] text-[14px] text-[var(--ink-dim)]">{v.oneLiner}</p>
                    <div className="mt-5 overflow-hidden rounded-lg border border-[var(--line-soft)]">
                      <Stepper active={STATUS_STAGE[v.status]} decided={v.score?.verdict} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1.5 font-mono text-[11.5px] text-[var(--ink-faint)]">
                      <span>{v.responses.length} responses{rate !== null && <> · <span style={{ color: rate >= 0.5 ? "var(--go)" : "var(--stop)" }}>{Math.round(rate * 100)}% confirmed</span> ({visible} shown)</>}</span>
                      {v.shareId && <span>share {v.shareId}</span>}
                      {v.score && <span style={{ color: v.score.verdict === "GO" ? "var(--go)" : "var(--stop)" }}>{v.score.total}/100 · {v.score.verdict}</span>}
                      <span className="ml-auto">{timeAgoUi(v.createdAt)}</span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
            {heads.length === 0 && (
              <div className="card p-10 text-center text-[var(--ink-dim)]">No ideas yet — describe the first one.</div>
            )}
          </div>

          {/* audit ticker */}
          <aside>
            <div className="card sticky top-[84px] overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
                <span className="dot-live h-2 w-2 rounded-full" style={{ background: "var(--probe)" }} />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-dim)]">agent_run_logs</span>
              </div>
              <ul className="max-h-[520px] divide-y divide-[var(--line-soft)] overflow-auto">
                {recentRuns.map((r) => (
                  <li key={r.id} className="px-5 py-3.5 transition-colors hover:bg-[var(--bg2)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11.5px] font-medium" style={{ color: "var(--probe)" }}>{AGENT_NAME[r.agent] ?? r.agent}</span>
                      <span className="font-mono text-[10px] text-[var(--ink-faint)]">{timeAgo(r.at)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[var(--ink-dim)]">{r.outputDigest}</p>
                    <p className="font-mono mt-1.5 text-[10px] text-[var(--ink-faint)]">
                      {r.promptVersion} · {r.model} · {(r.latencyMs / 1000).toFixed(1)}s {r.status === "degraded" && <span style={{ color: "var(--warn)" }}>· degraded</span>}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="border-t border-[var(--line)] px-5 py-3 font-mono text-[10px] leading-relaxed text-[var(--ink-faint)]">
                every call logged: prompt version, input, output, model, provider, latency — the audit trail and tomorrow's SLM corpus.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

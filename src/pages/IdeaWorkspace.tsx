import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBrains, founderVisible, computeConfirmationRate, HOLD_PENDING_FOR_REVIEW } from "../lib/store";
import { STATUS_LABEL, STATUS_STAGE, AGENTS, type IdeaVersion } from "../lib/domain";
import { AppShell } from "../components/shell";
import { StatusChip, Stepper, VerdictGauge, DimensionBars, KV, timeAgo, Reveal } from "../components/ui";

const AGENT_NAME = Object.fromEntries(AGENTS.map((a) => [a.id, a.name]));

const TABS = ["overview", "research", "questionnaire", "responses", "decision", "audit"] as const;
type Tab = (typeof TABS)[number];

function CopyLink({ shareId }: { shareId: string }) {
  const { toast } = useBrains();
  const url = `${location.origin}${location.pathname}#/q/${shareId}`;
  return (
    <div className="card p-6">
      <p className="kicker" style={{ color: "var(--go)" }}>public share link</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="font-mono flex-1 truncate rounded-lg border border-[var(--line)] bg-[var(--bg0)] px-4 py-2.5 text-[13px] text-[var(--probe)]">{url}</code>
        <button
          className="btn"
          onClick={() => {
            navigator.clipboard?.writeText(url).then(
              () => toast("Share link copied — it exposes only the questions", "ok"),
              () => toast(url, "info")
            );
          }}
        >
          Copy
        </button>
        <a className="btn btn-probe" href={`#/q/${shareId}`} target="_blank" rel="noreferrer">Open</a>
      </div>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
        Public links expose only the questions — never the idea, the research or the score.
      </p>
    </div>
  );
}

function ResearchView({ v }: { v: IdeaVersion }) {
  const { runResearch } = useBrains();
  const r = v.research;
  if (!r)
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-[20px] font-bold">No research yet</p>
        <p className="mt-2 text-[14px] text-[var(--ink-dim)]">Four agents — market, competitors, signals, pricing — will run and cite only retrieved sources.</p>
        {v.status === "draft" && (
          <button className="btn btn-probe mt-6" onClick={() => runResearch(v.ideaId)}>Run research agents</button>
        )}
      </div>
    );
  return (
    <div className="space-y-5">
      {r.unsourced && (
        <div className="rounded-[10px] border p-4 text-[13.5px]" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "var(--warn)" }}>
          ⚠ Live search returned nothing — this report is flagged <strong>unsourced</strong>. Model recall is not presented as researched fact. Re-run with live search on (Account → Engine).
        </div>
      )}
      <Reveal><div className="card p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="kicker" style={{ color: "var(--probe)" }}>executive summary</span>
          <span className="chip">{r.model}</span><span className="chip">{(r.latencyMs / 1000).toFixed(1)}s</span>
        </div>
        <p className="mt-3.5 text-[15.5px] leading-relaxed">{r.summary}</p>
      </div></Reveal>
      <Reveal><div className="grid gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">market size</p><p className="font-display mt-1.5 text-[24px] font-bold">{r.market.size}</p></div>
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">growth</p><p className="font-display mt-1.5 text-[24px] font-bold" style={{ color: "var(--go)" }}>{r.market.growth}</p></div>
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">trend</p><p className="mt-1.5 text-[13px] leading-snug text-[var(--ink-dim)]">{r.market.trend}</p></div>
      </div></Reveal>
      <Reveal><div className="card overflow-hidden">
        <div className="p-6 pb-0"><span className="kicker" style={{ color: "var(--probe)" }}>competitors</span></div>
        <table className="tbl mt-4"><thead><tr><th>Incumbent</th><th>Angle</th><th>The gap</th></tr></thead>
          <tbody>{r.competitors.map((c) => <tr key={c.name}><td className="font-display font-semibold">{c.name}</td><td className="text-[var(--ink-dim)]">{c.angle}</td><td style={{ color: "var(--go)" }}>{c.gap}</td></tr>)}</tbody>
        </table>
      </div></Reveal>
      <Reveal><div className="card p-6">
        <span className="kicker" style={{ color: "var(--probe)" }}>segments &amp; signals</span>
        <div className="mt-5"><DimensionBars dims={r.segments.map((s) => ({ label: `${s.name} · ${s.size}`, score: s.signal, weight: 0, note: `Where: ${s.where}` }))} /></div>
      </div></Reveal>
      <Reveal><div className="card p-6">
        <span className="kicker" style={{ color: "var(--probe)" }}>evidence ({r.evidence.length})</span>
        {r.evidence.length === 0 ? (
          <p className="mt-3 text-[13.5px] text-[var(--ink-dim)]">No retrieved sources for this run — see the unsourced flag above.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">{r.evidence.map((e) => (
            <li key={e.url} className="flex gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg2)] p-3.5">
              <span className="chip shrink-0 self-start" style={{ color: "var(--probe)" }}>{e.kind}</span>
              <div><p className="text-[13.5px] leading-relaxed">{e.claim}</p><p className="font-mono mt-1 text-[10.5px] text-[var(--ink-faint)]">{e.source} — traced to search pool ✓</p></div>
            </li>
          ))}</ul>
        )}
      </div></Reveal>
      <Reveal><div className="card p-6">
        <span className="kicker" style={{ color: "var(--probe)" }}>pricing intelligence</span>
        <div className="mt-3 flex flex-wrap gap-8">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">wtp range</p><p className="font-display mt-1 text-[26px] font-bold">${r.pricingIntel.wtpRange[0]}–${r.pricingIntel.wtpRange[1]}</p></div>
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">anchor</p><p className="font-display mt-1 text-[26px] font-bold" style={{ color: "var(--go)" }}>${r.pricingIntel.anchor}</p></div>
          <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">model</p><p className="mt-1 text-[14px]">{r.pricingIntel.model}</p></div>
        </div>
      </div></Reveal>
      <Reveal><div className="card p-6">
        <span className="kicker" style={{ color: "var(--warn)" }}>proposed changes — feed for the rework advisor</span>
        <ul className="mt-4 space-y-2.5">{r.proposedChanges.map((c, i) => (
          <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-[var(--ink-dim)]">
            <span className="font-mono text-[11px] text-[var(--warn)]">{String(i + 1).padStart(2, "0")}</span>{c}
          </li>
        ))}</ul>
      </div></Reveal>
    </div>
  );
}

function ResponsesView({ v }: { v: IdeaVersion }) {
  const { collectResponses, screenResponse, toast } = useBrains();
  const visible = founderVisible(v);
  const rejected = v.responses.length - founderVisible(v).filter((r) => r.screened !== "rejected").length;
  const rate = computeConfirmationRate(v);
  const yes = visible.filter((r) => r.confirmed === true).length;
  const [openId, setOpenId] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);

  if (!v.questions) return <div className="card p-10 text-center text-[var(--ink-dim)]">No round open yet — the questionnaire appears once the round starts.</div>;

  return (
    <div className="space-y-5">
      <div className="grid gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">received</p><p className="font-display mt-1.5 text-[26px] font-bold">{v.responses.length}</p></div>
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">shown to founder</p><p className="font-display mt-1.5 text-[26px] font-bold">{visible.length}</p></div>
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">confirmed yes</p><p className="font-display mt-1.5 text-[26px] font-bold" style={{ color: "var(--go)" }}>{yes}</p></div>
        <div className="bg-[var(--bg1)] p-5"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">confirmation rate</p><p className="font-display mt-1.5 text-[26px] font-bold" style={{ color: rate >= 0.5 ? "var(--go)" : "var(--stop)" }}>{Math.round(rate * 100)}%</p></div>
      </div>
      <p className="font-mono text-[11px] text-[var(--ink-faint)]">
        rate = confirmed ÷ shown ({yes}/{visible.length}) — the denominator is the list below, by construction. {rejected > 0 && <>{rejected} rejected {rejected === 1 ? "response stays" : "responses stay"} hidden. </>}
        {HOLD_PENDING_FOR_REVIEW ? "Pending held for review." : "Pending shown while the queue is unworked."}
      </p>

      <div className="card overflow-hidden">
        <table className="tbl">
          <thead><tr><th>Respondent</th><th>Channel</th><th>Screening</th><th>Would pay</th><th>When</th><th /></tr></thead>
          <tbody>
            {visible.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="cursor-pointer" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                  <td className="font-medium">{r.respondent}</td>
                  <td className="text-[var(--ink-dim)]">{r.channel}</td>
                  <td>
                    <span className="chip" style={{ color: r.screened === "approved" ? "var(--go)" : "var(--warn)", borderColor: "currentColor" }}>{r.screened}</span>
                  </td>
                  <td>
                    {r.confirmed === null ? <span className="font-mono text-[11px] text-[var(--ink-faint)]">—</span> : r.confirmed ? <span className="font-mono text-[12px] font-semibold" style={{ color: "var(--go)" }}>YES</span> : <span className="font-mono text-[12px] font-semibold" style={{ color: "var(--stop)" }}>NO</span>}
                  </td>
                  <td className="font-mono text-[11.5px] text-[var(--ink-faint)]">{timeAgo(r.createdAt)}</td>
                  <td>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--ink-faint)" strokeWidth="1.6" style={{ transform: openId === r.id ? "rotate(180deg)" : undefined, transition: "transform .2s" }}><path d="M3 5.5L7 9.5L11 5.5" /></svg>
                  </td>
                </tr>
                {openId === r.id && (
                  <tr>
                    <td colSpan={6} className="bg-[var(--bg0)]">
                      {r.note && <p className="mb-3 rounded-md border border-[var(--warn)] px-3 py-2 text-[12px]" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>{r.note}</p>}
                      <div className="space-y-3">
                        {r.answers.map((a, i) => (
                          <div key={i}>
                            <p className="font-mono text-[10.5px] text-[var(--ink-faint)]">Q{i + 1} · {a.q}</p>
                            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">“{a.a}”</p>
                          </div>
                        ))}
                      </div>
                      {r.screened === "pending" && (
                        <div className="mt-4 flex gap-2.5">
                          <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); screenResponse(v.id, r.id, true); }}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); screenResponse(v.id, r.id, false); }}>Reject</button>
                          <span className="font-mono self-center text-[10.5px] text-[var(--ink-faint)]">ops review — rejected never reaches the founder's numbers</span>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {visible.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-[var(--ink-dim)]">No responses yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {v.status === "validating" && (
        <button
          className="btn btn-probe"
          disabled={collecting}
          onClick={async () => {
            setCollecting(true);
            await collectResponses(v.ideaId);
            setCollecting(false);
            toast("Responses reconciled with the confirmation rate", "info");
          }}
        >
          {collecting ? "Interviewing respondents…" : "Collect 3 more responses"}
        </button>
      )}
    </div>
  );
}

export default function IdeaWorkspace() {
  const { slug } = useParams();
  const { db, getIdeaBySlug, runResearch, openRound, computeDecision, reworkVersion, killIdea, updateDraft, toast } = useBrains();
  const [tab, setTab] = useState<Tab>("overview");
  const [viewVersion, setViewVersion] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const idea = getIdeaBySlug(slug ?? "");
  const head = idea ? db.versions[idea.headVersionId] : undefined;
  const v = idea ? db.versions[viewVersion ?? idea.headVersionId] : undefined;

  const runs = useMemo(() => (idea ? db.runs.filter((r) => r.ideaId === idea.id).sort((a, b) => b.at - a.at) : []), [db.runs, idea]);

  if (!idea || !head || !v) {
    return (
      <AppShell title="ideas">
        <div className="card mx-auto mt-20 max-w-md p-10 text-center">
          <p className="font-display text-[22px] font-bold">Idea not found</p>
          <p className="mt-2 text-[14px] text-[var(--ink-dim)]">It may have been removed in a demo reset.</p>
          <Link to="/app" className="btn mt-6">Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const isHead = v.id === idea.headVersionId;
  const versions = idea.versionIds.map((id) => db.versions[id]);
  const stage = STATUS_STAGE[v.status];
  const busyState = v.status === "researching" || v.status === "scored";

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <AppShell title={`ideas / ${idea.slug}`}>
      <div className="mx-auto max-w-[1240px]">
        {/* header */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/app" className="btn btn-sm">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 8H4M7 4.5L3.5 8 7 11.5" /></svg>
            Ideas
          </Link>
          <h1 className="font-display text-[clamp(24px,3vw,36px)] font-bold tracking-tight">
            {v.title}
          </h1>
          <StatusChip status={v.status} label={STATUS_LABEL[v.status]} />
          {v.research?.unsourced && <span className="chip" style={{ color: "var(--warn)" }}>unsourced</span>}
          <div className="ml-auto flex items-center gap-2">
            {versions.map((vv) => (
              <button key={vv.id} onClick={() => { setViewVersion(vv.id === idea.headVersionId ? null : vv.id); setTab("overview"); }}
                className="btn btn-sm" title={vv.id === idea.headVersionId ? "head version" : `forked from v${db.versions[vv.parentVersionId!]?.version ?? "?"}`}
                style={v.id === vv.id ? { borderColor: "var(--probe)", color: "var(--probe)" } : undefined}>
                v{vv.version}{vv.id === idea.headVersionId ? " · head" : ""}
              </button>
            ))}
          </div>
        </div>

        {!isHead && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[10px] border p-3.5 text-[13px]" style={{ borderColor: "var(--probe)", background: "var(--probe-soft)", color: "var(--probe)" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4.5" cy="4" r="2" /><circle cx="4.5" cy="12" r="2" /><circle cx="11.5" cy="6" r="2" /><path d="M4.5 6v4" /></svg>
            Viewing history — versions are append-only, this report stays readable forever.
            <button className="btn btn-sm ml-auto" onClick={() => setViewVersion(null)}>Back to v{head.version} (head)</button>
          </div>
        )}

        {/* stepper + primary action */}
        <div className="card mt-6 overflow-hidden">
          <Stepper active={stage} decided={v.score?.verdict} />
          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-5 py-4">
            {v.status === "draft" && isHead && (
              <>
                <button className="btn btn-probe" disabled={busy} onClick={() => act(() => runResearch(idea.id))}>{busy ? "Agents running…" : "Run research agents"}</button>
                <button className="btn" onClick={() => setEditing((e) => !e)}>{editing ? "Done editing" : "Edit description"}</button>
              </>
            )}
            {v.status === "researching" && <span className="font-mono flex items-center gap-2.5 text-[12.5px] text-[var(--probe)]"><span className="dot-live h-2 w-2 rounded-full" style={{ background: "var(--probe)" }} />market → competitors → signals → pricing…</span>}
            {v.status === "researched" && isHead && <button className="btn btn-primary" disabled={busy} onClick={() => act(() => openRound(idea.id))}>Open the validation round</button>}
            {v.status === "validating" && isHead && (
              <>
                <button className="btn btn-primary" disabled={busy || v.responses.length < 5} onClick={() => act(() => computeDecision(idea.id))}>
                  {busy ? "Scoring…" : "Compute decision"}
                </button>
                {v.responses.length < 5 && <span className="font-mono text-[11px] text-[var(--ink-faint)]">collect ≥5 responses first ({v.responses.length}/5)</span>}
              </>
            )}
            {v.status === "scored" && <span className="font-mono flex items-center gap-2.5 text-[12.5px] text-[var(--warn)]"><span className="dot-live h-2 w-2 rounded-full" style={{ background: "var(--warn)" }} />evidence scoring…</span>}
            {(v.status === "go" || v.status === "nogo") && isHead && (
              <>
                {v.status === "nogo" && <button className="btn btn-probe" disabled={busy} onClick={() => act(() => reworkVersion(idea.id).then(() => setTab("overview")))}>Rework — fork v{v.version + 1}</button>}
                <span className="font-mono text-[11.5px] text-[var(--ink-faint)]">{v.status === "go" ? "GO — build it. The history stays as evidence." : "NO-GO — fork the next version or kill it."}</span>
              </>
            )}
            {v.status !== "killed" && isHead && (
              <button className="btn btn-danger btn-sm ml-auto" onClick={() => { killIdea(idea.id); }}>Kill idea</button>
            )}
            {v.status === "killed" && <span className="chip ml-auto" style={{ color: "var(--stop)" }}>killed — history readable</span>}
          </div>
        </div>

        {/* tabs */}
        <div className="mt-8 flex flex-wrap gap-1.5 border-b border-[var(--line)]">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className="font-display relative rounded-t-lg px-4 py-2.5 text-[13.5px] font-semibold capitalize transition-colors"
              style={tab === t ? { color: "var(--ink)", background: "var(--bg2)" } : { color: "var(--ink-faint)" }}>
              {t}
              {t === "responses" && v.responses.length > 0 && <span className="font-mono ml-2 text-[10px]" style={{ color: "var(--probe)" }}>{v.responses.length}</span>}
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-[2px]" style={{ background: "var(--probe)" }} />}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="card p-6">
                {editing && v.status === "draft" ? (
                  <OverviewEditor v={v} onSave={(f) => { updateDraft(v.ideaId, f); setEditing(false); toast("Description updated — still version 1 until a rework forks", "ok"); }} />
                ) : (
                  <>
                    <span className="kicker">the brief</span>
                    <div className="mt-4 space-y-0">
                      <KV k="one-liner" v={v.oneLiner} />
                      <KV k="audience" v={v.audience} />
                      <KV k="problem" v={v.problem} />
                      <KV k="riskiest assumption" v={<span style={{ color: "var(--warn)" }}>{v.assumption}</span>} />
                    </div>
                    {v.reworkNotes.length > 0 && (
                      <div className="mt-5 rounded-lg border p-4" style={{ borderColor: "var(--probe)", background: "var(--probe-soft)" }}>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em]" style={{ color: "var(--probe)" }}>forked with rework advisor input</p>
                        <ul className="mt-2.5 space-y-1.5 text-[13px] text-[var(--ink-dim)]">
                          {v.reworkNotes.map((n, i) => <li key={i}>— {n}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-5">
                <div className="card p-6">
                  <span className="kicker">vital signs</span>
                  <div className="mt-3">
                    <KV k="version" v={`v${v.version}${v.parentVersionId ? " · forked" : " · original"}`} />
                    <KV k="responses" v={`${v.responses.length} received · ${founderVisible(v).length} shown`} />
                    <KV k="confirmation" v={v.responses.length ? `${Math.round(computeConfirmationRate(v) * 100)}%` : "—"} />
                    <KV k="score" v={v.score ? `${v.score.total}/100 · ${v.score.verdict}` : "pending"} />
                    <KV k="created" v={timeAgo(v.createdAt)} />
                  </div>
                </div>
                {v.shareId && <CopyLink shareId={v.shareId} />}
              </div>
            </div>
          )}

          {tab === "research" && <ResearchView v={v} />}
          {tab === "questionnaire" && (
            <div className="space-y-5">
              {v.shareId && <CopyLink shareId={v.shareId} />}
              {v.questions ? (
                <div className="card divide-y divide-[var(--line-soft)]">
                  {v.questions.map((q, i) => (
                    <div key={q.id} className="flex gap-4 p-5">
                      <span className="font-mono text-[11px] text-[var(--probe)]">Q{i + 1}</span>
                      <div>
                        <p className="text-[14.5px] leading-relaxed">{q.text}</p>
                        <span className="chip mt-2" style={{ color: q.kind === "wtp" ? "var(--go)" : q.kind === "screen" ? "var(--warn)" : "var(--probe)" }}>{q.kind}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-10 text-center text-[var(--ink-dim)]">
                  The questionnaire is designed when the round opens{v.status === "draft" ? " — run research first" : v.status === "researching" ? " — research running" : ""}.
                </div>
              )}
            </div>
          )}
          {tab === "responses" && <ResponsesView v={v} />}
          {tab === "decision" && (
            v.score ? (
              <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
                <div className="card flex flex-col items-center p-8">
                  <VerdictGauge total={v.score.total} verdict={v.score.verdict} />
                  <div className="mt-6 w-full">
                    <KV k="threshold" v="50 / 100" />
                    <KV k="enforced by" v={<span className="font-mono" style={{ color: "var(--go)" }}>code — not the model</span>} />
                    <KV k="counted" v={`${v.score.responsesCounted} of ${v.score.responsesReceived} received`} />
                    <KV k="decided" v={timeAgo(v.score.decidedAt)} />
                  </div>
                </div>
                <div className="card p-7">
                  <span className="kicker" style={{ color: "var(--probe)" }}>five dimensions, weighted</span>
                  <div className="mt-6"><DimensionBars dims={v.score.dimensions} /></div>
                  {v.score.verdict === "NO-GO" && (
                    <p className="mt-6 rounded-lg border p-4 text-[13.5px]" style={{ borderColor: "var(--stop)", background: "var(--stop-soft)", color: "var(--stop)" }}>
                      Below the gate. The rework advisor can fork v{v.version + 1} with proposed changes — the evidence stays attached.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-10 text-center">
                <p className="font-display text-[20px] font-bold">No decision yet</p>
                <p className="mx-auto mt-2 max-w-[52ch] text-[14px] text-[var(--ink-dim)]">
                  When responses are in, evidence scoring weighs five dimensions and the 50% gate decides — enforced in code, so a model slip cannot flip your verdict.
                </p>
                {v.status === "validating" && isHead && (
                  <button className="btn btn-primary mt-6" disabled={busy || v.responses.length < 5} onClick={() => { setTab("decision"); act(() => computeDecision(idea.id)); }}>
                    Compute decision now
                  </button>
                )}
              </div>
            )
          )}
          {tab === "audit" && (
            <div className="card overflow-hidden">
              <table className="tbl">
                <thead><tr><th>When</th><th>Agent</th><th>Prompt</th><th>Model</th><th>Latency</th><th>Output</th></tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono whitespace-nowrap text-[11.5px] text-[var(--ink-faint)]">{timeAgo(r.at)}</td>
                      <td><span className="font-mono text-[12px]" style={{ color: "var(--probe)" }}>{AGENT_NAME[r.agent]}</span><span className="font-mono ml-2 text-[10px] text-[var(--ink-faint)]">v{db.versions[r.versionId]?.version}</span></td>
                      <td className="font-mono text-[11.5px]">{r.promptVersion}</td>
                      <td className="font-mono text-[11.5px] text-[var(--ink-dim)]">{r.provider}/{r.model}</td>
                      <td className="font-mono text-[11.5px]">{(r.latencyMs / 1000).toFixed(1)}s {r.status === "degraded" && <span style={{ color: "var(--warn)" }}>deg.</span>}</td>
                      <td className="max-w-[340px] text-[12.5px] text-[var(--ink-dim)]">{r.outputDigest}</td>
                    </tr>
                  ))}
                  {runs.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-[var(--ink-dim)]">No agent runs yet for this idea.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function OverviewEditor({ v, onSave }: { v: IdeaVersion; onSave: (f: Partial<Pick<IdeaVersion, "title" | "oneLiner" | "audience" | "problem" | "assumption">>) => void }) {
  const [f, setF] = useState({ title: v.title, oneLiner: v.oneLiner, audience: v.audience, problem: v.problem, assumption: v.assumption });
  return (
    <div className="space-y-4">
      {(["title", "oneLiner", "audience", "problem", "assumption"] as const).map((k) => (
        <div key={k}>
          <label className="label">{k === "oneLiner" ? "one-liner" : k}</label>
          {k === "problem" || k === "assumption" ? (
            <textarea className="input min-h-[70px] resize-y" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          ) : (
            <input className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          )}
        </div>
      ))}
      <button className="btn btn-primary" onClick={() => onSave(f)}>Save draft</button>
    </div>
  );
}

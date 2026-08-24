import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBrains, founderVisible, HOLD_PENDING_FOR_REVIEW } from "../lib/store";
import { AppShell } from "../components/shell";
import { Reveal, timeAgo } from "../components/ui";

const LEAD_COLOR: Record<string, string> = { new: "var(--ink-faint)", invited: "var(--probe)", replied: "var(--warn)", booked: "var(--go)" };

export default function Engage() {
  const { db, inviteLead, screenResponse, toast } = useBrains();
  const [pick, setPick] = useState<Record<string, string>>({});

  const pendingQueue = useMemo(
    () =>
      Object.values(db.versions)
        .flatMap((v) => v.responses.filter((r) => r.screened === "pending").map((r) => ({ v, r })))
        .sort((a, b) => b.r.createdAt - a.r.createdAt),
    [db.versions]
  );

  const ideaOptions = db.ideas.map((i) => ({ id: i.id, title: db.versions[i.headVersionId]?.title ?? i.slug }));

  return (
    <AppShell title="engage">
      <div className="mx-auto max-w-[1240px]">
        <p className="kicker">outreach &amp; review</p>
        <h1 className="font-display mt-2 text-[clamp(28px,3.4vw,42px)] font-bold">Talk to the right people. Screen everything.</h1>
        <p className="mt-3 max-w-[62ch] text-[15px] text-[var(--ink-dim)]">
          Protected validation outreach: invitations go to matched respondents only, and public links expose just the questions. The review queue is where nonsense dies before it reaches a founder's numbers.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* outreach pool */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-[20px] font-bold">Outreach pool</h2>
              <span className="font-mono text-[11px] text-[var(--ink-faint)]">sourced from founder communities · matched to your ideas</span>
            </div>
            <Reveal>
              <div className="card overflow-hidden">
                <table className="tbl">
                  <thead><tr><th>Respondent</th><th>Product</th><th>Match</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {db.leads.map((l) => (
                      <tr key={l.id}>
                        <td>
                          <p className="font-medium">{l.name}</p>
                          <p className="font-mono text-[11px] text-[var(--ink-faint)]">{l.email}</p>
                        </td>
                        <td className="text-[var(--ink-dim)]">{l.product}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="h-[5px] w-14 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                              <div className="h-full rounded-full" style={{ width: `${l.audienceMatch}%`, background: l.audienceMatch > 85 ? "var(--go)" : "var(--probe)" }} />
                            </div>
                            <span className="font-mono text-[11px] text-[var(--ink-dim)]">{l.audienceMatch}%</span>
                          </div>
                        </td>
                        <td><span className="chip" style={{ color: LEAD_COLOR[l.status], borderColor: "currentColor" }}>{l.status}</span></td>
                        <td>
                          {l.status === "new" && (
                            <div className="flex items-center gap-2">
                              <select className="input w-[130px] !py-1.5 text-[12px]" value={pick[l.id] ?? ""} onChange={(e) => setPick({ ...pick, [l.id]: e.target.value })} aria-label={`Attach ${l.name} to idea`}>
                                <option value="">attach idea…</option>
                                {ideaOptions.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
                              </select>
                              <button
                                className="btn btn-sm"
                                onClick={() => {
                                  const ideaId = pick[l.id];
                                  if (!ideaId) {
                                    toast("Attach the lead to an idea first", "warn");
                                    return;
                                  }
                                  inviteLead(l.id, ideaId);
                                }}
                              >
                                Invite
                              </button>
                            </div>
                          )}
                          {l.ideaId && l.status !== "new" && (
                            <Link className="font-mono text-[11px] text-[var(--probe)] hover:underline" to={`/app/ideas/${db.ideas.find((i) => i.id === l.ideaId)?.slug ?? ""}`}>
                              → {db.versions[db.ideas.find((i) => i.id === l.ideaId)?.headVersionId ?? ""]?.title}
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </section>

          {/* ops review */}
          <aside>
            <div className="card sticky top-[84px] overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
                <span className="dot-live h-2 w-2 rounded-full" style={{ background: "var(--warn)" }} />
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-dim)]">ops review queue</span>
                <span className="font-mono ml-auto text-[11px] text-[var(--warn)]">{pendingQueue.length}</span>
              </div>
              {pendingQueue.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-[var(--ink-dim)]">Queue empty — every submission has been screened.</p>
              ) : (
                <ul className="max-h-[430px] divide-y divide-[var(--line-soft)] overflow-auto">
                  {pendingQueue.map(({ v, r }) => (
                    <li key={r.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-medium">{r.respondent}</span>
                        <span className="font-mono text-[10px] text-[var(--ink-faint)]">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="font-mono mt-0.5 text-[10.5px] text-[var(--ink-faint)]">{v.title} · via {r.channel}</p>
                      <p className="mt-2 line-clamp-2 text-[12.5px] italic leading-snug text-[var(--ink-dim)]">“{r.answers[0]?.a}”</p>
                      {r.note && <p className="mt-1.5 text-[11px]" style={{ color: "var(--warn)" }}>{r.note}</p>}
                      <div className="mt-3 flex gap-2">
                        <button className="btn btn-sm btn-primary" onClick={() => screenResponse(v.id, r.id, true)}>Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => screenResponse(v.id, r.id, false)}>Reject</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-[var(--line)] px-5 py-3.5">
                <p className="font-mono text-[10px] leading-relaxed text-[var(--ink-faint)]">
                  {HOLD_PENDING_FOR_REVIEW ? "HOLD_PENDING_FOR_REVIEW = on — pending held back." : "HOLD_PENDING_FOR_REVIEW = off — pending shown & counted while the queue is unworked. Rejected stay invisible either way."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

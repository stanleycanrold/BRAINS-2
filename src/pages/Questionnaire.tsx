import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBrains } from "../lib/store";
import { Wordmark } from "../components/ui";

export default function Questionnaire() {
  const { shareId } = useParams();
  const { db, submitPublicResponse, toast } = useBrains();

  const version = useMemo(() => Object.values(db.versions).find((v) => v.shareId === shareId), [db.versions, shareId]);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  if (!version || !version.questions) {
    return (
      <div className="bg-layers flex min-h-screen items-center justify-center px-5">
        <div className="card w-full max-w-md p-10 text-center">
          <Wordmark />
          <p className="font-display mt-6 text-[22px] font-bold">Link not found</p>
          <p className="mt-2 text-[14px] text-[var(--ink-dim)]">This questionnaire link is invalid or the round was reset.</p>
          <Link to="/" className="btn mt-6">Back to BRAINS</Link>
        </div>
      </div>
    );
  }

  const qs = version.questions;
  const answered = qs.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;

  if (sent) {
    return (
      <div className="bg-layers flex min-h-screen items-center justify-center px-5">
        <div className="card tick-in w-full max-w-md p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--go-soft)", border: "1px solid var(--go)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--go)" strokeWidth="2"><path d="M4.5 12.5l5 5L19.5 7" /></svg>
          </span>
          <p className="font-display mt-5 text-[24px] font-bold">Thank you — that's evidence.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-dim)]">
            Your answers are being screened. Honest no's are worth more than polite yes's — the founder gets numbers, not flattery.
          </p>
          <p className="font-mono mt-6 text-[10.5px] text-[var(--ink-faint)]">public links expose only the questions — never the idea, research or score</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-layers noise min-h-screen">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex h-[62px] max-w-[760px] items-center justify-between px-5">
          <Link to="/"><Wordmark /></Link>
          <span className="font-mono text-[11px] text-[var(--ink-faint)]">3-minute interview</span>
        </div>
      </header>
      <main className="mx-auto max-w-[760px] px-5 py-12">
        <p className="kicker" style={{ color: "var(--go)" }}>customer interview</p>
        <h1 className="font-display mt-3 text-[clamp(28px,4.4vw,44px)] font-bold leading-[1.05]">Six questions. Zero pitch.</h1>
        <p className="mt-4 max-w-[58ch] text-[15.5px] leading-relaxed text-[var(--ink-dim)]">
          You're being asked because you match the audience. There is no product to sell you here — we're testing whether a problem is real. Answer like you'd answer a colleague.
        </p>

        <form
          className="mt-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (answered < qs.length) {
              toast(`Answer all ${qs.length} questions — ${answered} done`, "warn");
              return;
            }
            const ok = submitPublicResponse(shareId!, answers, name.trim());
            if (ok) setSent(true);
            else toast("Round closed — thanks anyway", "warn");
          }}
        >
          {qs.map((q, i) => (
            <div key={q.id} className="card p-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px]" style={{ color: "var(--probe)" }}>Q{i + 1}</span>
                <span className="chip" style={{ color: q.kind === "wtp" ? "var(--go)" : q.kind === "screen" ? "var(--warn)" : "var(--probe)" }}>{q.kind}</span>
              </div>
              <label className="mt-3 block text-[16px] font-medium leading-relaxed" htmlFor={q.id}>{q.text}</label>
              <textarea
                id={q.id}
                className="input mt-3 min-h-[86px] resize-y"
                placeholder="Be blunt — blunt is useful."
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            </div>
          ))}

          <div className="card p-6">
            <label className="label" htmlFor="resp-name">Your name (optional)</label>
            <input id="resp-name" className="input" placeholder="Dana R." value={name} onChange={(e) => setName(e.target.value)} />
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button type="submit" className="btn btn-primary" disabled={answered < qs.length}>
                Submit answers · {answered}/{qs.length}
              </button>
              <span className="font-mono text-[10.5px] text-[var(--ink-faint)]">screened before counting · rejected never shown</span>
            </div>
          </div>
        </form>
      </main>
      <footer className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-6">
          <p className="font-mono text-[10.5px] text-[var(--ink-faint)]">run by BRAINS — the validation engine</p>
          <Link className="font-mono text-[10.5px] text-[var(--probe)] hover:underline" to="/">what is this?</Link>
        </div>
      </footer>
    </div>
  );
}

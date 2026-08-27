import type { Metadata } from "next";
import { CheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { requireUser, isOpsUser } from "@/lib/auth";
import { listIdeas } from "@/lib/data/ideas";
import { AccountTopBar } from "./AccountTopBar";

export const metadata: Metadata = { title: "Account & billing" };

export default async function AccountPage() {
  const user = await requireUser();
  const ideas = await listIdeas(user.id, { includeArchived: true });
  const ops = await isOpsUser();
  const decided = ideas.filter((i) => i.state.decision_gate?.signal).length;

  // New billing placeholder — Stripe still wired but UI now reflects upcoming methods
  const TOKENS = {
    card: "#FFFFFF",
    canvas: "#FAFAFC",
    border: "#E2E8F0",
    subdued: "#F1F3F9",
    primary: "#7E22CE",
    textHeading: "#0F172A",
    textBody: "#334155",
    textSubdued: "#64748B",
    success: "#059669",
  } as const;

  return (
    <>
      <AccountTopBar />
      <div className="max-w-[960px]">
        <header className="mb-6">
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: TOKENS.textHeading }}>
            Account &amp; billing
          </h1>
          <p className="text-sm mt-1" style={{ color: TOKENS.textSubdued }}>
            Manage profile via Clerk, view usage, and see what’s next for billing. New methods coming soon — current Stripe checkout still works.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-5" style={{ background: TOKENS.card, borderColor: TOKENS.border }}>
            <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: TOKENS.textSubdued }}>
              Signed in as
            </div>
            <p className="text-sm font-semibold mt-2" style={{ color: TOKENS.textHeading }}>
              {user.name || "—"}
            </p>
            <p className="text-xs" style={{ color: TOKENS.textSubdued }}>
              {user.email}
            </p>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold" style={{ background: TOKENS.subdued, color: TOKENS.textBody }}>
                {ops ? "Ops access" : "Founder"}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-white" style={{ background: TOKENS.success }}>
                Active
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-5" style={{ background: TOKENS.card, borderColor: TOKENS.border }}>
            <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: TOKENS.textSubdued }}>
              Usage
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] font-bold mono" style={{ color: TOKENS.textHeading }}>
                {ideas.length}
              </span>
              <span className="text-sm" style={{ color: TOKENS.textSubdued }}>
                {ideas.length === 1 ? "idea" : "ideas"}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: TOKENS.textSubdued }}>
              {decided} taken to decision · {ideas.length - decided} in progress
            </p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-sm font-semibold" style={{ color: TOKENS.textHeading }}>
            Your plan
          </h2>
          <div className="mt-3 rounded-xl border p-6" style={{ background: TOKENS.card, borderColor: TOKENS.border }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-bold" style={{ color: TOKENS.textHeading }}>
                    Free
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ background: TOKENS.success }}>
                    Active
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: TOKENS.textSubdued }}>
                  Everything to validate yourself — upgrades for done-for-you research.
                </p>
              </div>
              <span className="text-[28px] font-bold" style={{ color: TOKENS.textHeading }}>
                $0
              </span>
            </div>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {["Unlimited ideas", "Research with real sources", "Community + script generation", "Scoring & decision gate", "Unlimited rework rounds", "Full version history"].map((f) => (
                <li key={f} className="text-xs flex items-start gap-2" style={{ color: TOKENS.textBody }}>
                  <CheckIcon size={14} weight="bold" className="mt-0.5 shrink-0" style={{ color: TOKENS.success }} aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border p-5 flex gap-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
            <SparkleIcon size={16} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
            <div>
              <h3 className="text-xs font-semibold" style={{ color: "#92400E" }}>
                New billing methods — coming soon
              </h3>
              <p className="text-xs mt-1 leading-5" style={{ color: "#92400E" }}>
                We’re moving beyond the old card-only flow. Upcoming: credits, invoices, and team billing. Current Stripe checkout still works for Fast Track — new options will appear here without you losing history.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold" style={{ color: TOKENS.textHeading }}>
            Invoices
          </h2>
          <div className="mt-3 rounded-xl border overflow-hidden" style={{ background: TOKENS.card, borderColor: TOKENS.border }}>
            <div className="grid grid-cols-3 gap-2 px-4 py-2 text-[11px] font-bold tracking-widest uppercase border-b" style={{ background: TOKENS.subdued, color: TOKENS.textSubdued, borderColor: TOKENS.border }}>
              <span>Date</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="px-4 py-8 text-center text-xs" style={{ color: TOKENS.textSubdued }}>
              Nothing billed yet — you haven’t bought anything. New billing will show here.
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

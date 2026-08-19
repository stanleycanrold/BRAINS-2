import type { Metadata } from "next";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { requireUser, isOpsUser } from "@/lib/auth";
import { listIdeas } from "@/lib/data/ideas";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { AccountTopBar } from "./AccountTopBar";

export const metadata: Metadata = { title: "Billing & account" };

/** B12 - Account & Billing (design system §4.12). */
export default async function AccountPage() {
  const user = await requireUser();
  // Archived included: this page totals up what was worked on and charged
  // for, and killing an idea does not undo the spend.
  const ideas = await listIdeas(user.id, { includeArchived: true });
  const ops = await isOpsUser();

  const decided = ideas.filter((i) => i.state.decision_gate?.signal).length;
  const paymentsLive = Boolean(process.env.stripe_private);

  return (
    <>
      <AccountTopBar />

      <header>
        <h1 className="type-display-l text-primary">Billing &amp; account</h1>
        <p className="type-body-l mt-1 text-secondary">
          Your plan, your usage, and everything you&rsquo;ve been charged.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card elevation="raised" className="p-5">
          <h2 className="type-caption text-tertiary uppercase">Signed in as</h2>
          <p className="type-body-l mt-2 font-medium text-primary">
            {user.name || "-"}
          </p>
          <p className="type-body-m text-secondary">{user.email}</p>
          {ops ? (
            <Badge tone="brand" className="mt-3">
              Ops access
            </Badge>
          ) : null}
        </Card>

        <Card elevation="raised" className="p-5">
          <h2 className="type-caption text-tertiary uppercase">Usage</h2>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="type-data-l text-[28px] text-primary">
              {ideas.length}
            </span>
            <span className="type-body-m text-secondary">
              {ideas.length === 1 ? "idea" : "ideas"}
            </span>
          </div>
          <p className="type-body-m mt-1 text-secondary">
            {decided} taken all the way to a decision.
          </p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="type-display-m text-primary">Your plan</h2>

        <Card elevation="raised" className="mt-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="type-display-m text-primary">Free</h3>
                <Badge tone="success" dot>
                  Active
                </Badge>
              </div>
              <p className="type-body-m mt-1 text-secondary">
                Everything you need to validate an idea yourself.
              </p>
            </div>
            <span className="type-data-l text-[28px] text-primary">$0</span>
          </div>

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              "Unlimited ideas",
              "Research with real sources",
              "Community and script generation",
              "Scoring and decision gate",
              "Unlimited rework rounds",
              "Full version history",
            ].map((feature) => (
              <li
                key={feature}
                className="type-body-m flex items-start gap-2.5 text-primary"
              >
                <CheckIcon
                  size={16}
                  weight="bold"
                  className="mt-1 shrink-0 text-success"
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="type-body-l font-medium text-primary">
                Fast Track &amp; Continued Social Scan
              </h3>
              <p className="type-body-m mt-1 max-w-prose text-secondary">
                Paid options - we run the interviews, or keep scanning
                communities for you between rounds.
              </p>
            </div>
            <Badge tone={paymentsLive ? "brand" : "neutral"}>
              {paymentsLive ? "Available" : "Not connected"}
            </Badge>
          </div>
          {!paymentsLive ? (
            <p className="type-body-m mt-3 border-t border-line pt-3 text-tertiary">
              Pricing is live and itemised on any idea&rsquo;s validation
              screen. Checkout switches on once Stripe keys are added.
            </p>
          ) : null}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="type-display-m text-primary">Invoices</h2>
        <div className="mt-4 rounded-[8px] border border-line bg-raised">
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th align="right">Amount</Th>
              </tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td colSpan={3} className="py-6 text-center text-tertiary">
                  Nothing billed yet - you haven&rsquo;t bought anything.
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </div>
      </section>
    </>
  );
}

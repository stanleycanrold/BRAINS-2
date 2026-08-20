import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { isOpsUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoney } from "@/lib/pricing";
import { NICHE_TIER_LABELS } from "@/lib/domain/types";
import { OpsTopBar } from "./OpsTopBar";

export const metadata: Metadata = { title: "Ops" };

/**
 * B13 - Admin / Ops console (design system §4.13).
 *
 * Deliberately NOT held to the same polish bar as the customer product:
 * clarity and density over delight, because Ops moves through many records
 * fast rather than being impressed. Access is an explicit email allow-list,
 * checked server-side before anything is queried.
 */

const PAYMENT_TONE: Record<string, BadgeTone> = {
  paid: "success",
  pending: "caution",
  failed: "danger",
  refunded: "neutral",
};

export default async function OpsPage() {
  if (!(await isOpsUser())) redirect("/dashboard");

  const orders = await db
    .select()
    .from(schema.fastTrackOrders)
    .orderBy(desc(schema.fastTrackOrders.createdAt))
    .limit(50);

  const pricing = await db.select().from(schema.pricingConfig);
  const experts = await db.select().from(schema.experts);

  const logs = await db
    .select()
    .from(schema.agentRunLogs)
    .orderBy(desc(schema.agentRunLogs.createdAt))
    .limit(25);

  const awaitingSourcing = orders.filter(
    (o) => o.paymentStatus === "paid" && o.status === "scheduling",
  ).length;
  const failures = logs.filter((l) => l.error !== null).length;

  return (
    <>
      <OpsTopBar />

      <header>
        <h1 className="type-display-l text-primary">Ops</h1>
        <p className="type-body-m mt-1 text-secondary">
          Internal. Fast Track queue, pricing, expert pool, and agent runs.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={orders.length} />
        <Stat label="Ready to source" value={awaitingSourcing} />
        <Stat label="Active experts" value={experts.filter((e) => e.active).length} />
        <Stat label="Agent errors" value={failures} danger />
      </div>

      {/* ── Fast Track queue ─────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="type-display-m text-primary">Fast Track queue</h2>
        <p className="type-body-m mt-1 text-secondary">
          Only paid orders are actionable. Nothing here gets sourced until
          payment reads <strong className="font-medium">paid</strong> - that is
          a hard rule, not a convention.
        </p>

        {orders.length === 0 ? (
          <EmptyState title="No orders yet" className="mt-4">
            Fast Track orders appear the moment a founder starts checkout, and
            become actionable once Stripe confirms payment.
          </EmptyState>
        ) : (
          <div className="mt-4 rounded-[8px] border border-line bg-raised">
            <Table dense>
              <Thead>
                <tr>
                  <Th>Created</Th>
                  <Th>Tier</Th>
                  <Th align="right">N</Th>
                  <Th>Location</Th>
                  <Th align="right">Total</Th>
                  <Th>Payment</Th>
                  <Th>Stage</Th>
                </tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td className="whitespace-nowrap">
                      <Link
                        href={`/ops/orders/${order.id}`}
                        className="text-brand hover:underline"
                      >
                        {formatDistanceToNow(order.createdAt, {
                          addSuffix: true,
                        })}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {NICHE_TIER_LABELS[order.nicheTier]}
                    </Td>
                    <Td align="right" className="font-mono tabular-nums">
                      {order.nRequested}
                    </Td>
                    {/* Whoever sources the interviews needs this before they
                        start, not after. */}
                    <Td className="max-w-[220px] truncate text-secondary">
                      {order.locationPreference || "Anywhere"}
                    </Td>
                    <Td align="right" className="font-mono tabular-nums">
                      {formatMoney(order.totalCostCents, order.currency)}
                    </Td>
                    <Td>
                      <Badge
                        tone={PAYMENT_TONE[order.paymentStatus] ?? "neutral"}
                        dot
                      >
                        {order.paymentStatus}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-secondary">
                      {order.status.replace(/_/g, " ")}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="type-display-m text-primary">Pricing</h2>
        <p className="type-body-m mt-1 text-secondary">
          Read from <code className="font-mono text-[13px]">pricing_config</code>{" "}
          at request time, so rates change without a deploy.
        </p>

        <div className="mt-4 rounded-[8px] border border-line bg-raised">
          <Table dense>
            <Thead>
              <tr>
                <Th>Tier</Th>
                <Th align="right">Per response</Th>
                <Th align="right">Analysis base</Th>
                <Th align="right">Per unit</Th>
                <Th align="right">Range</Th>
              </tr>
            </Thead>
            <Tbody>
              {pricing.map((row) => (
                <Tr key={row.id}>
                  <Td>{NICHE_TIER_LABELS[row.nicheTier]}</Td>
                  <Td align="right" className="font-mono tabular-nums">
                    {formatMoney(row.costPerInterviewCents, row.currency)}
                  </Td>
                  <Td align="right" className="font-mono tabular-nums">
                    {formatMoney(row.analysisFeeBaseCents, row.currency)}
                  </Td>
                  <Td align="right" className="font-mono tabular-nums">
                    {formatMoney(row.analysisFeePerUnitCents, row.currency)}
                  </Td>
                  <Td
                    align="right"
                    className="font-mono tabular-nums text-secondary"
                  >
                    {row.minInterviews}&ndash;{row.maxInterviews}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </section>

      {/* ── Agent runs ───────────────────────────────────────────────── */}
      <section className="mt-10 mb-4">
        <h2 className="type-display-m text-primary">Recent agent runs</h2>
        <p className="type-body-m mt-1 text-secondary">
          Every call logged with its prompt version - the audit trail, and the
          corpus the specialist SLMs will eventually train on.
        </p>

        {logs.length === 0 ? (
          <EmptyState title="No agent runs yet" className="mt-4">
            Runs appear here as soon as a founder submits an idea.
          </EmptyState>
        ) : (
          <div className="mt-4 rounded-[8px] border border-line bg-raised">
            <Table dense>
              <Thead>
                <tr>
                  <Th>When</Th>
                  <Th>Agent</Th>
                  <Th>Prompt</Th>
                  <Th>Model</Th>
                  <Th align="right">Latency</Th>
                  <Th>Result</Th>
                </tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr key={log.id}>
                    <Td className="whitespace-nowrap text-secondary">
                      {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                    </Td>
                    <Td className="whitespace-nowrap font-mono text-[13px]">
                      {log.agentName}
                    </Td>
                    <Td className="font-mono text-[13px] text-secondary">
                      {log.promptVersion}
                    </Td>
                    <Td className="max-w-[180px] truncate text-secondary">
                      {log.modelUsed}
                    </Td>
                    <Td
                      align="right"
                      className="font-mono tabular-nums text-secondary"
                    >
                      {(log.latencyMs / 1000).toFixed(1)}s
                    </Td>
                    <Td>
                      {log.error ? (
                        <Badge tone="danger" dot>
                          Failed
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>
                          OK
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="type-caption text-tertiary uppercase">{label}</p>
      <p
        className={`type-data-l mt-1 text-[24px] ${
          danger && value > 0 ? "text-danger" : "text-primary"
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

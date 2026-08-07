import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { isOpsUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/pricing";
import {
  ideaStateSchema,
  NICHE_TIER_LABELS,
  QUESTION_KIND_LABELS,
} from "@/lib/domain/types";
import { OpsTopBar } from "../../OpsTopBar";
import { OrderWorkspace } from "./OrderWorkspace";
import { originFromHeaders } from "@/lib/app-url";

export const metadata: Metadata = { title: "Order" };

/**
 * Everything needed to actually fulfil one paid order, on one screen.
 *
 * Interviewees are hired manually for now, so this is the working surface:
 * the questions the founder settled on, where they want people from, and a
 * place to type up each interview as it comes back. Without the questions
 * visible here there is no way to brief a freelancer, which made the paid
 * product unrunnable.
 */
export default async function OpsOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  if (!(await isOpsUser())) redirect("/dashboard");

  const { orderId } = await params;

  const [order] = await db
    .select()
    .from(schema.fastTrackOrders)
    .where(eq(schema.fastTrackOrders.id, orderId))
    .limit(1);

  if (!order) notFound();

  const [version] = await db
    .select()
    .from(schema.ideaStateVersions)
    .where(eq(schema.ideaStateVersions.id, order.ideaStateVersionId))
    .limit(1);

  if (!version) notFound();

  const state = ideaStateSchema.parse(version.stateJson);
  const questionnaire = state.validation.questionnaire;

  /**
   * The link sourced respondents answer on.
   *
   * It existed but was only rendered inside the founder's normal-track
   * Questions tab - a screen nobody on a paid round ever opens. The team
   * fulfilling the order, who are the only people who need to send it out,
   * had no way to see it at all.
   */
  const origin = await originFromHeaders();
  const panelUrl = questionnaire.panel_share_token
    ? `${origin}/q/${questionnaire.panel_share_token}`
    : null;

  const responses = await db
    .select()
    .from(schema.validationResponses)
    .where(
      eq(schema.validationResponses.ideaStateVersionId, order.ideaStateVersionId),
    )
    .orderBy(desc(schema.validationResponses.createdAt));

  // Only what came in through the paid round counts against this order.
  const fromThisOrder = responses.filter((r) => r.track === "fast");

  return (
    <>
      <OpsTopBar />

      <Link
        href="/ops"
        className="type-body-m inline-flex items-center gap-1.5 text-secondary hover:text-primary"
      >
        <ArrowLeftIcon size={15} aria-hidden="true" />
        Back to the queue
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="type-display-l text-primary">{state.title}</h1>
          <Badge tone={order.paymentStatus === "paid" ? "success" : "caution"} dot>
            {order.paymentStatus}
          </Badge>
          <Badge tone="neutral">{order.status.replace(/_/g, " ")}</Badge>
        </div>
        <p className="type-body-m mt-1 text-secondary">
          {order.nRequested} interviews ordered{" "}
          {formatDistanceToNow(order.createdAt, { addSuffix: true })} ·{" "}
          {formatMoney(order.totalCostCents, order.currency)} ·{" "}
          {NICHE_TIER_LABELS[order.nicheTier]}
        </p>
      </header>

      {/* The brief. Everything a freelancer needs to be told, in one block. */}
      <Card elevation="raised" className="mt-6 p-5">
        <h2 className="type-display-m text-primary">The brief</h2>
        <dl className="mt-4 space-y-3">
          <Row label="Who to talk to">{state.structured.icp || "Not set"}</Row>
          <Row label="Where they should be">
            {order.locationPreference || "Anywhere"}
          </Row>
          <Row label="Problem being tested">
            {state.structured.problem_statement || "Not set"}
          </Row>
          <Row label="Interviews needed">
            {order.nRequested} ({fromThisOrder.length} logged so far)
          </Row>
        </dl>
      </Card>

      {/* The questions the founder actually settled on. */}
      <Card elevation="raised" className="mt-4 p-5">
        <h2 className="type-display-m text-primary">
          Questions to ask{" "}
          <span className="type-body-m text-tertiary">
            {questionnaire.questions.length}
          </span>
        </h2>
        {questionnaire.intro ? (
          <p className="type-body-m mt-2 max-w-prose text-secondary">
            Intro the founder wrote: {questionnaire.intro}
          </p>
        ) : null}

        {questionnaire.questions.length === 0 ? (
          <p className="type-body-m mt-3 text-tertiary">
            The founder has not generated questions yet. Nothing can be run
            until they do.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {questionnaire.questions.map((q, i) => (
              <li
                key={q.id}
                className="rounded-[8px] border border-line bg-page p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="type-data-s shrink-0 text-tertiary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="type-body-l text-primary">{q.text}</p>
                    <p className="type-caption mt-1 text-tertiary">
                      {QUESTION_KIND_LABELS[q.kind].label}
                      {q.options.length
                        ? `: ${q.options.filter(Boolean).join(" / ")}`
                        : ""}
                      {q.intent ? ` · ${q.intent}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <OrderWorkspace
        orderId={order.id}
        versionId={order.ideaStateVersionId}
        nRequested={order.nRequested}
        panelUrl={panelUrl}
        responses={fromThisOrder.map((r) => ({
          id: r.id,
          notes: r.notes,
          source: r.source,
          confirmed: r.confirmed,
          reviewStatus: r.reviewStatus,
          qualityFlags: r.qualityFlags,
          qualityReasoning: r.qualityReasoning,
          qualityConfidence: r.qualityConfidence,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <dt className="type-body-m w-48 shrink-0 text-tertiary">{label}</dt>
      <dd className="type-body-m min-w-0 text-primary">{children}</dd>
    </div>
  );
}

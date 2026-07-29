import { CheckIcon, WarningIcon, LinkSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { ScoreGauge } from "./ScoreGauge";

/**
 * The proof artifact: what a finished report actually looks like.
 *
 * Built from the real report's own structure rather than drawn as a picture -
 * the score with its reasoning, the confirmation rate, a risk factor stated
 * plainly, and cited evidence. A screenshot would go stale the first time the
 * product changes; this cannot, and it stays legible at any width.
 *
 * The numbers are illustrative and the page says so directly. Presenting an
 * invented report as a real customer's would be the exact kind of unearned
 * proof this product refuses to trade in.
 */
export function SampleReport() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-raised shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <p className="type-body-m truncate font-medium text-primary">
          Invoice chasing for freelance designers
        </p>
        <span className="type-caption shrink-0 rounded-full bg-brand-subtle px-2.5 py-1 text-brand">
          Go ahead
        </span>
      </div>

      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
        <ScoreGauge score={72} size="md" className="shrink-0 self-center" />
        <div className="min-w-0">
          <p className="type-body-l text-primary">
            14 of 19 people described chasing invoices unprompted, and six
            already pay for something to help.
          </p>
          <p className="type-body-m mt-2 text-secondary">
            The strongest objection: most said they would not switch tools
            mid-project, which makes onboarding timing the real risk.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
        <Stat label="Confirmed" value="74%" />
        <Stat label="Responses" value="19" />
        <Stat label="Sources" value="11" />
        <Stat label="Round" value="v2" />
      </dl>

      <div className="space-y-3 border-t border-line p-5 sm:p-6">
        <Row
          icon={
            <CheckIcon
              size={15}
              weight="bold"
              className="text-success"
              aria-hidden="true"
            />
          }
          text="Every claim links to where we found it"
        />
        <Row
          icon={
            <WarningIcon
              size={15}
              className="text-caution"
              aria-hidden="true"
            />
          }
          text="Sample skews to one community, flagged as a risk factor"
        />
        <Row
          icon={
            <LinkSimpleIcon
              size={15}
              className="text-tertiary"
              aria-hidden="true"
            />
          }
          text="All 19 raw responses stay readable, not just the summary"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-raised px-5 py-4">
      <dt className="type-caption text-tertiary">{label}</dt>
      <dd className="type-data-m mt-0.5 text-primary">{value}</dd>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="type-body-m flex items-start gap-2.5 text-secondary">
      <span className="mt-1 shrink-0">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

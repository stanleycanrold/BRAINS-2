import {
  MagnifyingGlassIcon,
  CheckIcon,
  WarningIcon,
  PlusIcon,
  HouseIcon,
  ChartBarIcon,
  UsersThreeIcon,
  GearIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ScoreGauge } from "./ScoreGauge";

/**
 * The product, shown rather than described.
 *
 * A marketing page's single biggest credibility lever is a visitor seeing the
 * real thing early, and the fastest way to lose that is a stale screenshot
 * that stops matching the product. This is built from the app's own layout in
 * markup instead: it cannot go out of date silently, it stays sharp on any
 * display, it reflows on a phone rather than becoming an unreadable
 * thumbnail, and it costs no image weight on the largest element above the
 * fold.
 *
 * The figures shown are illustrative and the page says so beneath it.
 */

const STAGES = ["Entry", "Research", "Validate", "Decide"];

export function ProductShowcase() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-raised shadow-[var(--shadow-overlay)]">
      <div className="flex">
        {/* Rail - hidden on phones, where it would eat a third of the width
            for something that carries no information here. */}
        <aside className="hidden w-[168px] shrink-0 flex-col border-r border-line bg-sunken p-3 sm:flex lg:w-[200px]">
          <div className="flex h-8 items-center gap-2 px-1">
            <span className="size-2 rounded-full bg-mark" aria-hidden="true" />
            <span className="type-caption font-bold tracking-[0.16em] text-primary uppercase">
              Brains
            </span>
          </div>

          <div className="mt-4 flex h-8 items-center gap-2 rounded-[8px] bg-brand px-2.5 text-on-accent">
            <PlusIcon size={13} weight="bold" aria-hidden="true" />
            <span className="type-caption">New idea</span>
          </div>

          <nav className="mt-4 space-y-0.5" aria-hidden="true">
            <RailItem icon={<HouseIcon size={14} />} label="Dashboard" active />
            <RailItem icon={<ChartBarIcon size={14} />} label="Reports" />
            <RailItem icon={<UsersThreeIcon size={14} />} label="Engage" />
            <RailItem icon={<GearIcon size={14} />} label="Settings" />
          </nav>

          <div className="mt-5 border-t border-line pt-3">
            <p className="type-caption px-2 text-tertiary">Ideas</p>
            <div className="mt-2 space-y-1.5 px-2">
              <RailIdea label="Invoice chasing" tone="success" />
              <RailIdea label="Farm to kitchen" tone="brand" />
              <RailIdea label="Shift swapping" tone="caution" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Top bar with the pipeline stepper, as in the app */}
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:gap-3 sm:px-5">
            <span className="type-caption hidden truncate text-primary sm:inline">
              Invoice chasing for freelance designers
            </span>
            <ol
              className="flex items-center gap-1 sm:ml-auto"
              aria-hidden="true"
            >
              {STAGES.map((stage, i) => (
                <li key={stage} className="flex items-center gap-1">
                  {i > 0 ? (
                    <span className="h-px w-3 bg-line sm:w-4" />
                  ) : null}
                  <span
                    className={
                      i === 3
                        ? "type-caption rounded-full bg-brand-subtle px-2 py-0.5 text-brand"
                        : "type-caption px-1 text-tertiary"
                    }
                  >
                    {stage}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-4 sm:p-6">
            {/* Score band */}
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
              <ScoreGauge score={72} size="md" className="shrink-0" />
              <div className="min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="type-caption rounded-full bg-success-subtle px-2.5 py-1 text-success">
                    Go ahead
                  </span>
                  <span className="type-caption text-tertiary">
                    74% confirmed · 19 responses
                  </span>
                </div>
                <p className="type-body-m mt-2.5 text-primary">
                  14 of 19 described chasing invoices unprompted. Six already
                  pay for something to help.
                </p>
              </div>
            </div>

            {/* Findings */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Panel
                icon={
                  <MagnifyingGlassIcon
                    size={13}
                    className="text-brand"
                    aria-hidden="true"
                  />
                }
                title="Evidence"
                lines={[
                  "11 sources, each linked",
                  "3 competitors named, with the gap they leave",
                ]}
              />
              <Panel
                icon={
                  <WarningIcon
                    size={13}
                    className="text-caution"
                    aria-hidden="true"
                  />
                }
                title="The case against"
                lines={[
                  "Most would not switch mid-project",
                  "Sample skews to one community",
                ]}
              />
            </div>

            {/* Response strip */}
            <div className="mt-3 rounded-[10px] border border-line bg-page p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="type-caption text-tertiary">
                  Raw responses
                </span>
                <span className="type-caption text-tertiary">19</span>
              </div>
              <div className="mt-2.5 space-y-2">
                <Response
                  verdict="Yes"
                  tone="success"
                  text="I lose about half a day a month to this."
                />
                <Response
                  verdict="No"
                  tone="danger"
                  text="My accountant handles it, so it never reaches me."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RailItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex items-center gap-2 rounded-[6px] bg-wash-hover px-2 py-1.5 text-primary"
          : "flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-tertiary"
      }
    >
      {icon}
      <span className="type-caption">{label}</span>
    </div>
  );
}

function RailIdea({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "brand" | "caution";
}) {
  const dot =
    tone === "success"
      ? "bg-success"
      : tone === "brand"
        ? "bg-brand"
        : "bg-caution";

  return (
    <div className="flex items-center gap-2">
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <span className="type-caption truncate text-secondary">{label}</span>
    </div>
  );
}

function Panel({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-[10px] border border-line bg-page p-3.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="type-caption text-secondary">{title}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line) => (
          <li key={line} className="type-caption flex items-start gap-1.5 text-primary">
            <CheckIcon
              size={11}
              weight="bold"
              className="mt-1 shrink-0 text-tertiary"
              aria-hidden="true"
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Response({
  verdict,
  tone,
  text,
}: {
  verdict: string;
  tone: "success" | "danger";
  text: string;
}) {
  const chip =
    tone === "success"
      ? "bg-success-subtle text-success"
      : "bg-danger-subtle text-danger";

  return (
    <div className="flex items-start gap-2">
      <span className={`type-caption shrink-0 rounded-full px-1.5 py-0.5 ${chip}`}>
        {verdict}
      </span>
      <span className="type-caption min-w-0 text-secondary">{text}</span>
    </div>
  );
}

import {
  ChartBarIcon,
  CheckIcon,
  CompassIcon,
  GearIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ScoreGauge } from "./ScoreGauge";

const STAGES = ["Idea", "Signal", "People", "Plan"];

export function ProductShowcase() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-line bg-raised shadow-[var(--shadow-overlay)]">
      <div className="flex">
        <aside className="hidden w-[168px] shrink-0 flex-col border-r border-line bg-sunken p-3 sm:flex lg:w-[200px]">
          <div className="flex h-8 items-center gap-2 px-1">
            <span className="size-2 rounded-full bg-mark" aria-hidden="true" />
            <span className="type-caption font-bold tracking-[0.16em] text-primary uppercase">
              Brains
            </span>
          </div>

          <div className="mt-4 flex h-8 items-center gap-2 rounded-[6px] bg-brand px-2.5 text-on-accent">
            <PlusIcon size={13} weight="bold" aria-hidden="true" />
            <span className="type-caption">New idea</span>
          </div>

          <nav className="mt-4 space-y-0.5" aria-hidden="true">
            <RailItem icon={<HouseIcon size={14} />} label="Dashboard" active />
            <RailItem icon={<ChartBarIcon size={14} />} label="Research" />
            <RailItem icon={<UsersThreeIcon size={14} />} label="People" />
            <RailItem icon={<GearIcon size={14} />} label="Settings" />
          </nav>

          <div className="mt-5 border-t border-line pt-3">
            <p className="type-caption px-2 text-tertiary">Ideas</p>
            <div className="mt-2 space-y-1.5 px-2">
              <RailIdea label="Invoice follow-up" tone="success" />
              <RailIdea label="Farm to kitchen" tone="brand" />
              <RailIdea label="Shift swapping" tone="caution" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:gap-3 sm:px-5">
            <span className="type-caption hidden truncate text-primary sm:inline">
              Invoice follow-up for freelance designers
            </span>
            <ol className="flex items-center gap-1 sm:ml-auto" aria-hidden="true">
              {STAGES.map((stage, index) => (
                <li key={stage} className="flex items-center gap-1">
                  {index > 0 ? <span className="h-px w-3 bg-line sm:w-4" /> : null}
                  <span
                    className={
                      index === 3
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
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
              <ScoreGauge score={72} size="md" className="shrink-0" />
              <div className="min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="type-caption rounded-full bg-success-subtle px-2.5 py-1 text-success">
                    Promising signal
                  </span>
                  <span className="type-caption text-tertiary">
                    74% confirmed - 19 responses
                  </span>
                </div>
                <p className="type-body-m mt-2.5 text-primary">
                  Independent designers recognise the problem, and several
                  already pay for imperfect ways to reduce it.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Panel
                icon={<MagnifyingGlassIcon size={13} className="text-brand" aria-hidden="true" />}
                title="Demand signal"
                lines={[
                  "14 of 19 described the problem unprompted",
                  "Six already pay for an alternative",
                ]}
              />
              <Panel
                icon={<UsersThreeIcon size={13} className="text-brand" aria-hidden="true" />}
                title="First customer path"
                lines={[
                  "Four niche communities to begin with",
                  "Discovery questions drafted from the research",
                ]}
              />
            </div>

            <div className="mt-3 rounded-[8px] border border-line bg-page p-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="type-caption text-tertiary">Next conversations</span>
                <CompassIcon size={14} className="text-brand" aria-hidden="true" />
              </div>
              <div className="mt-2.5 space-y-2">
                <Response
                  label="Start here"
                  tone="brand"
                  text="Independent designer communities"
                />
                <Response
                  label="Ask next"
                  tone="success"
                  text="What makes invoice follow-up difficult today?"
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
    <div className="rounded-[8px] border border-line bg-page p-3.5">
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
  label,
  tone,
  text,
}: {
  label: string;
  tone: "brand" | "success";
  text: string;
}) {
  const chip =
    tone === "brand"
      ? "bg-brand-subtle text-brand"
      : "bg-success-subtle text-success";

  return (
    <div className="flex items-start gap-2">
      <span className={`type-caption shrink-0 rounded-full px-1.5 py-0.5 ${chip}`}>
        {label}
      </span>
      <span className="type-caption min-w-0 text-secondary">{text}</span>
    </div>
  );
}

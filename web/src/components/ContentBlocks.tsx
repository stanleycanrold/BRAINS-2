import { CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Faq } from "./Faq";
import type { Block } from "@/content/types";
import { cn } from "@/lib/cn";

/**
 * Every block type, rendered. The complete visual vocabulary of the pSEO
 * system in one file, so changing how a table or a step list looks changes it
 * on every page at once.
 *
 * Each block decides its own width, and that is what makes an edge-to-edge
 * page work. Prose caps itself at a readable measure no matter how much room
 * it is given; tables, card grids and comparisons expand to fill it. The
 * width gets spent on the things that benefit from width, never on stretching
 * a sentence.
 *
 * There is no escape hatch and no `raw html` block, deliberately. The first
 * page allowed to bring its own markup is the page that starts the drift back
 * towards hundreds of hand-built layouts, after which nothing can be
 * restyled centrally again.
 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose":
      return (
        <div className="max-w-[70ch] space-y-5">
          {block.paragraphs.map((text) => (
            <p key={text} className="type-body-l text-secondary">
              {text}
            </p>
          ))}
        </div>
      );

    case "callout":
      return (
        <p className="mk-panel type-body-xl max-w-[64ch] p-6 font-medium text-primary sm:p-7">
          {block.text}
        </p>
      );

    case "steps":
      return (
        <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {block.items.map((item, i) => (
            <li key={item.title} className="flex gap-4">
              <span className="type-data-s shrink-0 pt-0.5 text-tertiary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                {item.badge ? (
                  <span
                    className={cn(
                      "type-eyebrow mb-2.5 inline-block rounded-full border px-2.5 py-1",
                      item.badge.tone === "danger"
                        ? "border-danger-border bg-danger-subtle text-danger"
                        : "border-transparent bg-success-subtle text-success",
                    )}
                  >
                    {item.badge.text}
                  </span>
                ) : null}
                <h3 className="type-body-l font-medium text-primary">
                  {item.title}
                </h3>
                <p className="type-body-m mt-2 text-secondary">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      );

    case "cards":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {block.items.map((item) => (
            <div key={item.title} className="mk-card p-6">
              <h3 className="type-body-l font-medium text-primary">
                {item.title}
              </h3>
              <p className="type-body-m mt-2.5 text-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {block.items.map((item) => (
            <li
              key={item}
              className="type-body-l flex items-start gap-3 text-primary"
            >
              <CheckIcon
                size={16}
                weight="bold"
                className="mt-1.5 shrink-0 text-success"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "compare":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <CompareColumn
            heading={block.positive.heading}
            items={block.positive.items}
            tone="positive"
          />
          <CompareColumn
            heading={block.negative.heading}
            items={block.negative.items}
            tone="negative"
          />
        </div>
      );

    case "table":
      return (
        // Wide tables scroll inside their own box. The page body must never
        // scroll sideways on a phone to accommodate one.
        <div className="mk-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {block.columns.map((col) => (
                    <th
                      key={col}
                      className="type-eyebrow px-6 py-4 text-tertiary"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row) => (
                  <tr
                    key={row.join("|")}
                    className="border-b border-line last:border-0"
                  >
                    {row.map((cell, i) => (
                      <td
                        key={cell}
                        className={cn(
                          "px-6 py-5 align-top",
                          i === 0 && "type-body-m font-medium text-primary",
                          // The measured column is mono and never wraps, so a
                          // range like "12 to 15" cannot break across lines.
                          i === 1 &&
                            "type-data-s whitespace-nowrap text-brand",
                          i > 1 && "type-body-m text-secondary",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "faq":
      return <Faq items={block.items} />;
  }
}

function CompareColumn({
  heading,
  items,
  tone,
}: {
  heading: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const Icon = tone === "positive" ? CheckIcon : XIcon;

  return (
    <div className="mk-card p-6">
      <h3 className="type-body-l flex items-center gap-2.5 font-medium text-primary">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            tone === "positive"
              ? "bg-success-subtle text-success"
              : "bg-danger-subtle text-danger",
          )}
        >
          <Icon size={13} weight="bold" aria-hidden="true" />
        </span>
        {heading}
      </h3>
      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li
            key={item}
            className="type-body-m flex items-start gap-3 text-secondary"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-2 size-1.5 shrink-0 rounded-full",
                tone === "positive" ? "bg-success" : "bg-danger",
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

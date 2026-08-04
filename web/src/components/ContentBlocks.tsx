import { CheckIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Faq } from "./Faq";
import type { Block } from "@/content/types";
import { cn } from "@/lib/cn";

/**
 * Every block type, rendered. The complete visual vocabulary of the pSEO
 * system, in one file, so that changing how a table or a step list looks
 * changes it on every page at once.
 *
 * There is no escape hatch and no `raw html` block, deliberately. The first
 * page allowed to bring its own markup is the page that starts the drift back
 * towards hundreds of hand-built layouts, and after that nothing can be
 * restyled centrally again.
 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.kind) {
    case "prose":
      return (
        <div className="space-y-4">
          {block.paragraphs.map((text) => (
            <p key={text} className="type-body-l text-secondary">
              {text}
            </p>
          ))}
        </div>
      );

    case "callout":
      return (
        <p className="type-body-l border-l-2 border-brand pl-5 font-medium text-primary">
          {block.text}
        </p>
      );

    case "steps":
      return (
        <ol className="space-y-8">
          {block.items.map((item, i) => (
            <li key={item.title} className="flex gap-5">
              <span className="type-data-s shrink-0 text-tertiary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                {item.badge ? (
                  <span
                    className={cn(
                      "type-caption mb-2 inline-block rounded-full border px-2.5 py-1 uppercase",
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
            <div
              key={item.title}
              className="rounded-[12px] border border-line bg-raised p-5"
            >
              <h3 className="type-body-l font-medium text-primary">
                {item.title}
              </h3>
              <p className="type-body-m mt-2 text-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <ul className="space-y-3">
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
        <div className="grid gap-8 sm:grid-cols-2">
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {block.columns.map((col) => (
                  <th
                    key={col}
                    className="type-caption pr-4 pb-3 text-tertiary uppercase last:pr-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")} className="border-b border-line">
                  {row.map((cell, i) => (
                    <td
                      key={cell}
                      className={cn(
                        "py-4 pr-4 align-top last:pr-0",
                        i === 0 && "type-body-m font-medium text-primary",
                        // The measured column is mono and never wraps, so a
                        // range like "12 to 15" cannot break across lines.
                        i === 1 &&
                          "type-data-s whitespace-nowrap text-primary",
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
    <div>
      <h3 className="type-body-l font-medium text-primary">{heading}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="type-body-m flex items-start gap-3 text-secondary"
          >
            <Icon
              size={15}
              weight="bold"
              className={cn(
                "mt-1.5 shrink-0",
                tone === "positive" ? "text-success" : "text-danger",
              )}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

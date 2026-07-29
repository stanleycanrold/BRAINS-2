"use client";

import * as React from "react";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type FaqItem = { question: string; answer: string };

/**
 * Accordion FAQ. Native <details>/<summary> rather than hand-rolled state:
 * it is keyboard accessible and findable by in-page search for free, and it
 * still renders open-able content with JavaScript disabled.
 *
 * The caller is responsible for emitting FAQPage JSON-LD alongside this -
 * the markup and the structured data should come from the same array so they
 * cannot drift apart.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <details key={item.question} className="group" open={i === 0}>
          <summary
            className={cn(
              "type-body-l flex cursor-pointer list-none items-center justify-between gap-4",
              "py-5 font-medium text-primary marker:content-none",
              "hover:text-brand",
            )}
          >
            {item.question}
            <CaretDownIcon
              size={18}
              aria-hidden="true"
              className="shrink-0 text-tertiary transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="type-body-m -mt-1 pb-5 text-secondary">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data, generated from the same array the UI renders. */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

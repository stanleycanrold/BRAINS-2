"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { href: "/ops", label: "Orders" },
  { href: "/ops/review", label: "Response review" },
  { href: "/ops/outreach", label: "Outreach" },
];

export function OpsTopBar() {
  const pathname = usePathname();

  return (
    <TopBar>
      <span className="type-body-m font-medium text-primary">Ops</span>
      <Badge tone="caution">Internal</Badge>
      {/* The review queue needs a way in. It is the only place an unapproved
          response can be seen at all now that founders are shown approved
          ones only, so burying it behind a URL would mean responses quietly
          going unreviewed. */}
      <nav className="flex items-center gap-1">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={cn(
              "type-body-m rounded-[6px] px-2.5 py-1 transition-colors duration-[120ms]",
              pathname === section.href
                ? "bg-wash-hover text-primary"
                : "text-secondary hover:text-primary",
            )}
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </TopBar>
  );
}

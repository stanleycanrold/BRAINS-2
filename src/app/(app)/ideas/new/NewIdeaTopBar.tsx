"use client";

import Link from "next/link";
import { TopBar } from "@/components/shell/AppShell";

export function NewIdeaTopBar() {
  return (
    <TopBar>
      <Link
        href="/ideas"
        className="type-body-m text-secondary transition-colors hover:text-primary"
      >
        Ideas
      </Link>
      <span className="type-body-m text-tertiary" aria-hidden="true">
        /
      </span>
      <span className="type-body-m font-medium text-primary">New Idea</span>
    </TopBar>
  );
}

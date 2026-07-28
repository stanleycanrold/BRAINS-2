"use client";

import { TopBar } from "@/components/shell/AppShell";
import { Badge } from "@/components/ui/Badge";

export function OpsTopBar() {
  return (
    <TopBar>
      <span className="type-body-m font-medium text-primary">Ops</span>
      <Badge tone="caution">Internal</Badge>
    </TopBar>
  );
}

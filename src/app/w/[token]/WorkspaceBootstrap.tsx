"use client";

import * as React from "react";
import { WORKSPACE_TOKEN_COOKIE } from "@/lib/workspace-token";

export function WorkspaceBootstrap({ token, ideaId }: { token: string; ideaId: string }) {
  React.useEffect(() => {
    document.cookie = `${WORKSPACE_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
    window.location.replace(`/ideas/${ideaId}`);
  }, [ideaId, token]);

  return <p className="p-8 text-secondary">Opening workspace...</p>;
}

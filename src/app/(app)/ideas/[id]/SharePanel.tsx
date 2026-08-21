"use client";

import * as React from "react";
import {
  CheckIcon,
  CopyIcon,
  LinkSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";

/**
 * Public sharing for the whole journey.
 *
 * Two controls, and the second one matters more than it looks. Turning the
 * link on is the founder's decision to make about their own idea. Including
 * what respondents wrote is a decision about somebody else's words, so it is
 * separate, off by default, and labelled with what it actually does rather
 * than as a formatting option.
 *
 * `origin` is passed in from the server rather than read off `window`. It
 * has to be right on localhost, on preview deploys and in production, and a
 * link that quietly points at the wrong host is worse than no link - but
 * reading it in an effect would render the wrong value first and then
 * correct it, which is a flash of a copyable-looking broken URL.
 */
export function SharePanel({
  ideaId,
  origin,
  initialToken,
  initialIncludesResponses,
  initialFounderReadOnlyToken,
  initialFounderEditorToken,
}: {
  ideaId: string;
  /** The origin this request actually arrived on. See lib/app-url.ts. */
  origin: string;
  initialToken: string | null;
  initialIncludesResponses: boolean;
  initialFounderReadOnlyToken: string | null;
  initialFounderEditorToken: string | null;
}) {
  const { toast } = useToast();
  const [token, setToken] = React.useState(initialToken);
  const [includesResponses, setIncludesResponses] = React.useState(
    initialIncludesResponses,
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [founderTokens, setFounderTokens] = React.useState<Record<"read" | "edit", string | null>>({
    read: initialFounderReadOnlyToken,
    edit: initialFounderEditorToken,
  });
  const [founderBusy, setFounderBusy] = React.useState<"read" | "edit" | null>(null);

  const url = token ? `${origin}/s/${token}` : "";

  async function post(body: Record<string, unknown>, label: string) {
    setBusy(label);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const failed = await response.json().catch(() => ({}));
        throw new Error(failed.error ?? "We couldn't update sharing.");
      }
      return await response.json();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "We couldn't update sharing.",
        "danger",
      );
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function create() {
    const body = await post({ action: "create" }, "create");
    if (body) {
      setToken(body.token);
      toast("Share link created", "success");
    }
  }

  async function revoke() {
    const body = await post({ action: "revoke" }, "revoke");
    if (body) {
      setToken(null);
      toast("Link revoked. Anyone holding it now sees nothing.", "success");
    }
  }

  async function toggleResponses(next: boolean) {
    setIncludesResponses(next);
    const body = await post(
      { action: "set_responses", include: next },
      "responses",
    );
    // Snap back if the server disagreed, rather than leaving the checkbox
    // showing a setting that was never saved.
    if (!body) setIncludesResponses(!next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy failed. Select the link and copy it manually.", "danger");
    }
  }

  async function createFounder(permission: "read" | "edit") {
    setFounderBusy(permission);
    const body = await post({ action: "create_founder", permission }, `founder-${permission}`);
    setFounderBusy(null);
    if (body) {
      setFounderTokens((current) => ({ ...current, [permission]: body.token }));
      toast(`${permission === "edit" ? "Editor" : "Read-only"} founder link created`, "success");
    }
  }

  async function revokeFounder(permission: "read" | "edit") {
    setFounderBusy(permission);
    const body = await post({ action: "revoke_founder", permission }, `revoke-founder-${permission}`);
    setFounderBusy(null);
    if (body) setFounderTokens((current) => ({ ...current, [permission]: null }));
  }

  async function copyFounder(permission: "read" | "edit") {
    const token = founderTokens[permission];
    if (!token) return;
    await navigator.clipboard.writeText(`${origin}/w/${token}`);
    toast("Founder workspace link copied", "success");
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <LinkSimpleIcon
          size={18}
          className="mt-0.5 shrink-0 text-tertiary"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 className="type-body-l font-medium text-primary">
            Share this journey
          </h2>
          <p className="type-body-m mt-1 text-secondary">
            A read-only page showing every round, what changed between them,
            and what each concluded. No account needed to open it, and it is
            never indexed by search.
          </p>

          {token ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <code className="type-caption min-w-0 flex-1 truncate rounded-[6px] border border-line bg-page px-3 py-2 text-secondary">
                  {url}
                </code>
                <Button
                  variant="secondary"
                  onClick={() => void copy()}
                  iconLeft={
                    copied ? (
                      <CheckIcon size={15} aria-hidden="true" />
                    ) : (
                      <CopyIcon size={15} aria-hidden="true" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="ghost"
                  loading={busy === "revoke"}
                  disabled={Boolean(busy)}
                  onClick={() => void revoke()}
                  iconLeft={<TrashIcon size={15} aria-hidden="true" />}
                >
                  Revoke
                </Button>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <Checkbox
                  checked={includesResponses}
                  onChange={(next) => void toggleResponses(next)}
                  disabled={busy === "responses"}
                  label="Include what respondents wrote"
                  description="Off by default. People answered your questionnaire for your research, not for a public page. Either way the shared view never shows who a response came from, or which expert ran a paid interview."
                />
              </div>
            </>
          ) : (
            <Button
              variant="secondary"
              className="mt-4"
              loading={busy === "create"}
              disabled={Boolean(busy)}
              onClick={() => void create()}
              iconLeft={<LinkSimpleIcon size={15} aria-hidden="true" />}
            >
              Create share link
            </Button>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="type-body-l font-medium text-primary">Founder workspace</h3>
            <p className="type-body-m mt-1 text-secondary">
              Give a founder a private workspace where they can see the work and review the questions before deciding whether to continue.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["read", "edit"] as const).map((permission) => {
                const founderUrl = founderTokens[permission] ? `${origin}/w/${founderTokens[permission]}` : "";
                return (
                  <div key={permission} className="rounded-[8px] border border-line p-4">
                    <p className="type-body-m font-medium text-primary">{permission === "edit" ? "Editor" : "Read-only"}</p>
                    <p className="type-caption mt-1 text-secondary">{permission === "edit" ? "Can edit questions and approve them." : "Can review the research without changing it."}</p>
                    {founderUrl ? (
                      <>
                        <code className="type-caption mt-3 block truncate text-secondary">{founderUrl}</code>
                        <div className="mt-3 flex gap-2">
                          <Button variant="secondary" onClick={() => void copyFounder(permission)} iconLeft={<CopyIcon size={14} aria-hidden="true" />}>Copy</Button>
                          <Button variant="ghost" loading={founderBusy === permission} onClick={() => void revokeFounder(permission)} iconLeft={<TrashIcon size={14} aria-hidden="true" />}>Revoke</Button>
                        </div>
                      </>
                    ) : (
                      <Button className="mt-3" variant="secondary" loading={founderBusy === permission} disabled={Boolean(founderBusy)} onClick={() => void createFounder(permission)} iconLeft={<LinkSimpleIcon size={15} aria-hidden="true" />}>Create link</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

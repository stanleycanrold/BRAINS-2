"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

type Recipient = { email: string; product: string; greeting: string; subject: string };

export function OutreachView({
  testRecipient,
  recipients,
}: {
  testRecipient: string;
  recipients: Recipient[];
}) {
  const { toast } = useToast();
  const [confirmation, setConfirmation] = React.useState("");
  const [busy, setBusy] = React.useState<"test" | "send" | null>(null);

  async function run(action: "test" | "send") {
    setBusy(action);
    try {
      const response = await fetch("/api/ops/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirmation }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "The email action failed.");
      toast(
        action === "test"
          ? `Test copy sent to ${body.to}.`
          : `${body.sent} sent, ${body.failed} failed.`,
        body.failed ? "danger" : "success",
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "The email action failed.", "danger");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <header>
        <p className="type-eyebrow text-brand">Internal outreach</p>
        <h1 className="type-display-l mt-2 text-primary">Validation invitations</h1>
        <p className="type-body-m mt-1 max-w-prose text-secondary">
          {recipients.length} valid recipients loaded. GitHub and Google addresses are excluded and duplicates are removed.
        </p>
      </header>

      <Card elevation="raised" className="mt-6 max-w-[760px] p-5">
        <h2 className="type-display-m text-primary">Test before sending</h2>
        <p className="type-body-m mt-1.5 text-secondary">
          The test uses the first valid recipient&rsquo;s product name and sends only to {testRecipient}.
        </p>
        <Button className="mt-4" variant="primary" loading={busy === "test"} onClick={() => void run("test")}>
          Send test copy
        </Button>
      </Card>

      <Card className="mt-4 max-w-[760px] border-danger-border p-5">
        <h2 className="type-display-m text-primary">Send first 50</h2>
        <p className="type-body-m mt-1.5 text-secondary">
          This sends externally from the configured Resend address. Confirm the test copy first, then type the phrase below.
        </p>
        <label htmlFor="outreach-confirm" className="type-body-m mt-4 block font-medium text-primary">
          Confirmation phrase
        </label>
        <Input id="outreach-confirm" className="mt-2 max-w-[260px]" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="SEND FIRST 50" />
        <Button className="mt-4" variant="secondary" loading={busy === "send"} disabled={confirmation !== "SEND FIRST 50"} onClick={() => void run("send")}>
          Send first 50
        </Button>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="type-display-m text-primary">Recipient preview</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b border-line"><th className="pb-2 pr-4 type-caption text-tertiary">Product</th><th className="pb-2 pr-4 type-caption text-tertiary">Email</th><th className="pb-2 type-caption text-tertiary">Greeting</th></tr></thead>
            <tbody>{recipients.slice(0, 50).map((recipient) => <tr key={recipient.email} className="border-b border-line"><td className="py-2 pr-4 type-body-m text-primary">{recipient.product}</td><td className="py-2 pr-4 type-body-m text-secondary">{recipient.email}</td><td className="py-2 type-body-m text-secondary">{recipient.greeting}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
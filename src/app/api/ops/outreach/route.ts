import { NextResponse } from "next/server";
import { isOpsUser } from "@/lib/auth";
import {
  buildTestOutreachRecipient,
  getOutreachRecipients,
  outreachTestRecipient,
  sendOutreachEmail,
  sendOutreachBatch,
} from "@/lib/outreach";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isOpsUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const recipients = await getOutreachRecipients();
  return NextResponse.json({
    testRecipient: outreachTestRecipient(),
    recipients: recipients.map((recipient) => ({
      email: recipient.email,
      product: recipient.product,
      greeting: recipient.greeting,
      subject: recipient.subject,
    })),
    sample: recipients[0]
      ? {
          email: recipients[0].email,
          product: recipients[0].product,
          greeting: recipients[0].greeting,
          subject: recipients[0].subject,
        }
      : null,
  });
}

export async function POST(request: Request) {
  if (!(await isOpsUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json()) as { action?: string; confirmation?: string };
  const recipients = await getOutreachRecipients();
  const first = recipients[0];
  if (!first) return NextResponse.json({ error: "No valid recipients found." }, { status: 400 });

  if (body.action === "test") {
    await sendOutreachEmail(buildTestOutreachRecipient(), outreachTestRecipient());
    return NextResponse.json({ sent: 1, to: outreachTestRecipient(), product: first.product });
  }

  if (body.action !== "send" || body.confirmation !== "SEND FIRST 50") {
    return NextResponse.json({ error: "Type SEND FIRST 50 to authorize the batch." }, { status: 400 });
  }

  try {
    await sendOutreachBatch(recipients);
    return NextResponse.json({ sent: recipients.length, failed: 0, attempted: recipients.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The outreach batch failed." },
      { status: 502 },
    );
  }
}
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fill in all fields correctly." }, { status: 400 });
    }
    const { name, email, message } = parsed.data;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "BRAINS AI <hello@nexabrains.io>";
    const to = "stanley@nexabrains.io";

    if (!apiKey) {
      return NextResponse.json({ error: "Email service not configured. Please email directly to stanley@nexabrains.io" }, { status: 500 });
    }

    const subject = `New contact from ${name} — BRAINS AI`;
    const text = [`New contact via BRAINS AI website:`, ``, `Name: ${name}`, `Email: ${email}`, ``, `Message:`, message, ``, `Reply to: ${email}`].join("\n");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[contact] Resend failed:", body);
      return NextResponse.json({ error: "Could not send message. Please email stanley@nexabrains.io directly." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact] error", e);
    return NextResponse.json({ error: "Something went wrong. Please email stanley@nexabrains.io" }, { status: 500 });
  }
}

import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

const CSV_PATH = path.join(process.cwd(), "producthunt_founders_emails_report.csv");
const TEST_RECIPIENT = "stanleycanrold@gmail.com";
const FROM_EMAIL = "stanley@nexabrains.io";
const EXCLUDED_DOMAINS = new Set(["github.com", "google.com"]);

const EMAIL_COPY = `When a product is live, usage and opinions can tell you what is happening. They do not always tell you whether the right people understand the problem you intended to solve, or what would make them choose it.

BRAINS runs focused validation with people who fit a product's target audience. The output is a clear readout of what resonated, what created doubt, and which changes are worth testing next.

Here is a sample validation readout: https://app.nexabrains.io/s/wUfwu1e-qTkQ9UTcSu_bN1u4YVGLXi8j

More about BRAINS: https://nexabrains.io

Would this kind of evidence be useful for [product]?

Stanley
Founder, BRAINS AI
stanley@nexabrains.io`;

type CsvRow = {
  product: string;
  emails: string[];
};

export type OutreachRecipient = {
  email: string;
  product: string;
  greeting: string;
  subject: string;
  text: string;
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  fields.push(field);
  return fields;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/);
  const header = parseCsvLine(lines.shift() ?? "");
  const productIndex = header.indexOf("Product Name");
  const emailIndex = header.indexOf("Contact Email(s)");
  if (productIndex < 0 || emailIndex < 0) {
    throw new Error("The outreach CSV is missing its product or email columns.");
  }

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const fields = parseCsvLine(line);
      return {
        product: fields[productIndex]?.trim() ?? "",
        emails: (fields[emailIndex] ?? "")
          .split(";")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      };
    });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

function buildRecipient(email: string, product: string): OutreachRecipient {
  const greeting = `Hi ${product} team,`;
  const text = `${greeting}\n\n${EMAIL_COPY.replaceAll("[product]", product)}`;
  return {
    email,
    product,
    greeting,
    subject: `a question about ${product}`,
    text,
  };
}

export async function getOutreachRecipients(limit = 50): Promise<OutreachRecipient[]> {
  const content = await readFile(CSV_PATH, "utf8");
  const rows = parseCsv(content);
  const seen = new Set<string>();
  const recipients: OutreachRecipient[] = [];

  for (const row of rows) {
    if (!row.product) continue;
    for (const email of row.emails) {
      if (
        !isValidEmail(email) ||
        EXCLUDED_DOMAINS.has(domainOf(email)) ||
        seen.has(email)
      ) {
        continue;
      }
      seen.add(email);
      recipients.push(buildRecipient(email, row.product));
      if (recipients.length >= limit) return recipients;
    }
  }

  return recipients;
}

export function outreachTestRecipient(): string {
  return TEST_RECIPIENT;
}

export async function sendOutreachEmail(
  recipient: OutreachRecipient,
  to = recipient.email,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM must be configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: [FROM_EMAIL],
      subject: recipient.subject,
      text: recipient.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the message with status ${response.status}.`);
  }
}
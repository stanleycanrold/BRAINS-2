import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Reads uploaded documents into text.
 *
 * The files themselves are NOT stored. What matters for research is what the
 * document says, not the document, so we extract the text, keep an excerpt on
 * the idea, and drop the bytes. That removes a whole class of problems we
 * would otherwise be signing up for: file storage, retention, access control
 * on private decks, and virus scanning.
 *
 * A file we cannot read is not an error. It comes back with an empty excerpt
 * and the UI says so, because silently attaching something that contributes
 * nothing is worse than saying we could not read it.
 */

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
/** Enough for the model to work with; far short of the context limit. */
const MAX_EXCERPT = 20000;

export async function POST(request: Request) {
  try {
    await requireUser();

    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const attachments = [];

    for (const file of files.slice(0, MAX_FILES)) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `${file.name} is larger than 10MB.` },
          { status: 413 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({
        name: file.name,
        excerpt: (await extractText(file, buffer)).slice(0, MAX_EXCERPT),
      });
    }

    return NextResponse.json({ attachments });
  } catch (err) {
    console.error("[POST /api/attachments]", err);
    return NextResponse.json(
      { error: "We couldn't read those files." },
      { status: 500 },
    );
  }
}

async function extractText(file: File, buffer: Buffer): Promise<string> {
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return normalise(result.text);
    }

    // Everything else we accept is already text.
    return normalise(buffer.toString("utf8"));
  } catch (err) {
    // Reported to the founder as "we couldn't read this one" rather than
    // failing the whole upload.
    console.error(`[attachments] could not read ${file.name}`, err);
    return "";
  }
}

/** Collapses the ragged whitespace PDF extraction produces. */
function normalise(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

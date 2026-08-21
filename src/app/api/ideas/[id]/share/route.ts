import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import {
  createShareToken,
  createFounderShareToken,
  getShareSettings,
  revokeFounderShareToken,
  revokeShareToken,
  setShareIncludesResponses,
} from "@/lib/data/journey";

export const runtime = "nodejs";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create") }),
  z.object({ action: z.literal("revoke") }),
  z.object({
    action: z.literal("set_responses"),
    include: z.boolean(),
  }),
  z.object({
    action: z.literal("create_founder"),
    permission: z.enum(["read", "edit"]),
  }),
  z.object({
    action: z.literal("revoke_founder"),
    permission: z.enum(["read", "edit"]),
  }),
]);

/**
 * POST /ideas/:id/share - create, revoke, or adjust a public journey link.
 *
 * Every branch re-reads the idea through `getIdea(id, user.id)` first, so a
 * token can only ever be minted for an idea the caller owns. Revoking nulls
 * the token; creating again mints a fresh one rather than restoring the old,
 * which is what makes revocation mean anything.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const user = await requireUser();
    const idea = await getIdea(id, user.id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found." }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    if (parsed.data.action === "create") {
      const token = await createShareToken(id, user.id);
      return NextResponse.json({ token });
    }

    if (parsed.data.action === "revoke") {
      await revokeShareToken(id, user.id);
      return NextResponse.json({ token: null });
    }

    if (parsed.data.action === "create_founder") {
      const token = await createFounderShareToken(id, user.id, parsed.data.permission);
      return NextResponse.json({ token, permission: parsed.data.permission });
    }

    if (parsed.data.action === "revoke_founder") {
      await revokeFounderShareToken(id, user.id, parsed.data.permission);
      return NextResponse.json({ token: null, permission: parsed.data.permission });
    }

    await setShareIncludesResponses(id, user.id, parsed.data.include);
    const settings = await getShareSettings(id, user.id);
    return NextResponse.json({
      token: settings?.shareToken ?? null,
      includesResponses: settings?.shareIncludesResponses ?? false,
    });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/share]`, err);
    return NextResponse.json(
      { error: "We couldn't update sharing." },
      { status: 500 },
    );
  }
}

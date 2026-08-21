import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireUser, workspaceAccess } from "@/lib/auth";
import { getIdea } from "@/lib/data/ideas";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const access = await workspaceAccess();
    const user = await requireUser();
    if (!access || access.userId === user.id) {
      return NextResponse.json(
        { error: "Only a shared founder can report payment here." },
        { status: 403 },
      );
    }

    const idea = await getIdea(id, user.id);
    if (!idea) return NextResponse.json({ error: "Idea not found." }, { status: 404 });

    const [order] = await db
      .select({ id: schema.fastTrackOrders.id, paymentStatus: schema.fastTrackOrders.paymentStatus })
      .from(schema.fastTrackOrders)
      .where(
        and(
          eq(schema.fastTrackOrders.ideaStateVersionId, idea.versionId),
          eq(schema.fastTrackOrders.userId, user.id),
        ),
      )
      .limit(1);

    if (!order) return NextResponse.json({ error: "No Fast Track order found." }, { status: 404 });
    if (order.paymentStatus === "paid") return NextResponse.json({ reported: true });

    await db
      .update(schema.fastTrackOrders)
      .set({ paymentReportedAt: new Date() })
      .where(eq(schema.fastTrackOrders.id, order.id));

    return NextResponse.json({ reported: true });
  } catch (err) {
    console.error(`[POST /api/ideas/${id}/fast-track/payment-reported]`, err);
    return NextResponse.json({ error: "We couldn't report the payment yet." }, { status: 500 });
  }
}
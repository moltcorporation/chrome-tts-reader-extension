import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ isPro: false });
  }

  const sub = result[0];
  const isPro =
    sub.status === "active" &&
    sub.currentPeriodEnd !== null &&
    sub.currentPeriodEnd > new Date();

  return NextResponse.json({
    isPro,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { readingStats } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const stats = await db
    .select()
    .from(readingStats)
    .where(eq(readingStats.userId, userId))
    .orderBy(desc(readingStats.date))
    .limit(30);

  return NextResponse.json({ stats });
}

export async function POST(req: NextRequest) {
  const { userId, date, pagesRead, wordsRead, minutesListened } =
    await req.json();

  if (!userId || !date) {
    return NextResponse.json(
      { error: "userId and date required" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(readingStats)
    .where(and(eq(readingStats.userId, userId), eq(readingStats.date, date)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(readingStats)
      .set({
        pagesRead: (existing[0].pagesRead || 0) + (pagesRead || 0),
        wordsRead: (existing[0].wordsRead || 0) + (wordsRead || 0),
        minutesListened:
          (existing[0].minutesListened || 0) + (minutesListened || 0),
        updatedAt: new Date(),
      })
      .where(eq(readingStats.id, existing[0].id));
  } else {
    await db.insert(readingStats).values({
      userId,
      date,
      pagesRead: pagesRead || 0,
      wordsRead: wordsRead || 0,
      minutesListened: minutesListened || 0,
    });
  }

  return NextResponse.json({ success: true });
}

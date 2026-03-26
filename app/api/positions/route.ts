import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { readingPositions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const url = req.nextUrl.searchParams.get("url");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (url) {
    const position = await db
      .select()
      .from(readingPositions)
      .where(
        and(
          eq(readingPositions.userId, userId),
          eq(readingPositions.url, url)
        )
      )
      .limit(1);

    return NextResponse.json({ position: position[0] || null });
  }

  const positions = await db
    .select()
    .from(readingPositions)
    .where(eq(readingPositions.userId, userId))
    .orderBy(desc(readingPositions.savedAt))
    .limit(20);

  return NextResponse.json({ positions });
}

export async function POST(req: NextRequest) {
  const { userId, url, title, position, totalWords } = await req.json();

  if (!userId || !url) {
    return NextResponse.json(
      { error: "userId and url required" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(readingPositions)
    .where(
      and(
        eq(readingPositions.userId, userId),
        eq(readingPositions.url, url)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(readingPositions)
      .set({
        position: position || 0,
        totalWords: totalWords || 0,
        title: title || existing[0].title,
        savedAt: new Date(),
      })
      .where(eq(readingPositions.id, existing[0].id));
  } else {
    await db.insert(readingPositions).values({
      userId,
      url,
      title: title || "",
      position: position || 0,
      totalWords: totalWords || 0,
    });
  }

  return NextResponse.json({ success: true });
}

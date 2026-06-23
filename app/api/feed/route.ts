import { NextResponse } from "next/server";
import { getCachedArticles } from "@/lib/fetcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await getCachedArticles();
    return NextResponse.json({ articles, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[/api/feed]", err);
    return NextResponse.json(
      { error: "Failed to fetch articles. Please try again shortly." },
      { status: 500 }
    );
  }
}

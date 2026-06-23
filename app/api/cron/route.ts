import { NextRequest, NextResponse } from "next/server";
import { getCachedArticles } from "@/lib/fetcher";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articles = await getCachedArticles();
    return NextResponse.json({ warmed: true, count: articles.length });
  } catch (err) {
    console.error("[/api/cron]", err);
    return NextResponse.json({ error: "Warm-up failed" }, { status: 500 });
  }
}

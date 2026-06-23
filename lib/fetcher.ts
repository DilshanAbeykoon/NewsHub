import { unstable_cache } from "next/cache";
import Parser from "rss-parser";
import { createHash } from "crypto";
import type { Article } from "./types";
import { sources } from "./sources";

const FETCH_TIMEOUT_MS = 10_000;
const OG_TIMEOUT_MS = 5_000;
const MAX_PER_SOURCE = 30;
// How many articles per source we try to enrich with OG images
const OG_ENRICH_LIMIT = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function articleId(url: string): string {
  const canonical = url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/[?#].*$/, "");
  return createHash("sha1").update(canonical).digest("hex").slice(0, 16);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 280);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("fetch timeout")), ms)
    ),
  ]);
}

// ── OG image fetching ─────────────────────────────────────────────────────────

const OG_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
const OG_RE2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i;

async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OG_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "ai-news-hub/1.0 (feed enricher)" },
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    // Only read first 20 KB — enough for <head>
    const reader = res.body?.getReader();
    if (!reader) return undefined;
    let html = "";
    while (html.length < 20_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      if (html.includes("</head>")) break;
    }
    reader.cancel();
    const m = OG_RE.exec(html) ?? OG_RE2.exec(html);
    const imgUrl = m?.[1];
    if (imgUrl && imgUrl.startsWith("http")) return imgUrl;
    return undefined;
  } catch {
    return undefined;
  }
}

// ── RSS image extraction ──────────────────────────────────────────────────────

type RssItem = Parser.Item & {
  mediaContent?: { $?: { url?: string }; url?: string };
  mediaThumbnail?: { $?: { url?: string }; url?: string };
  contentEncoded?: string;
  "media:content"?: { $?: { url?: string }; url?: string };
  "media:thumbnail"?: { $?: { url?: string }; url?: string };
  enclosure?: { url?: string; type?: string };
};

const IMG_RE = /<img[^>]+src=["']([^"']+)["']/i;

function extractRssImage(item: RssItem): string | undefined {
  const mc = item.mediaContent ?? item["media:content"];
  if (mc) {
    const url = typeof mc === "string" ? mc : (mc.$?.url ?? mc.url);
    if (url && url.startsWith("http")) return url;
  }

  const mt = item.mediaThumbnail ?? item["media:thumbnail"];
  if (mt) {
    const url = typeof mt === "string" ? mt : (mt.$?.url ?? mt.url);
    if (url && url.startsWith("http")) return url;
  }

  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }

  const html = item.contentEncoded ?? item.content ?? "";
  const m = IMG_RE.exec(html);
  if (m?.[1]?.startsWith("http")) return m[1];

  return undefined;
}

// ── Per-source fetchers ───────────────────────────────────────────────────────

const rssParser = new Parser<Record<string, unknown>, RssItem>({
  timeout: FETCH_TIMEOUT_MS,
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

async function fetchRssAtom(
  name: string,
  url: string,
  category: Article["category"]
): Promise<Article[]> {
  const feed = await rssParser.parseURL(url);
  const articles = (feed.items ?? []).slice(0, MAX_PER_SOURCE).map((item) => {
    const link = item.link ?? item.guid ?? "";
    return {
      id: articleId(link),
      title: (item.title ?? "Untitled").trim(),
      url: link,
      source: name,
      category,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      summary: item.contentSnippet
        ? stripHtml(item.contentSnippet)
        : item.content
        ? stripHtml(item.content)
        : undefined,
      imageUrl: extractRssImage(item),
    };
  });

  // For articles missing an image, fetch OG image from article page (capped)
  const noImage = articles.filter((a) => !a.imageUrl && a.url).slice(0, OG_ENRICH_LIMIT);
  if (noImage.length > 0) {
    const ogResults = await Promise.allSettled(
      noImage.map((a) => fetchOgImage(a.url))
    );
    ogResults.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        noImage[i].imageUrl = result.value;
      }
    });
  }

  return articles;
}

interface HNHit {
  objectID: string;
  title: string;
  url?: string;
  story_url?: string;
  created_at: string;
  points?: number;
  story_text?: string;
}

async function fetchHackerNews(): Promise<Article[]> {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search?query=AI+LLM+machine+learning&tags=story&hitsPerPage=30",
    { headers: { "User-Agent": "ai-news-hub/1.0" } }
  );
  if (!res.ok) throw new Error(`HN API ${res.status}`);
  const data = (await res.json()) as { hits: HNHit[] };
  const articles = (data.hits ?? []).slice(0, MAX_PER_SOURCE).map((hit) => {
    const link =
      hit.url ??
      hit.story_url ??
      `https://news.ycombinator.com/item?id=${hit.objectID}`;
    return {
      id: articleId(link),
      title: hit.title,
      url: link,
      source: "Hacker News",
      category: "discussion" as const,
      publishedAt: hit.created_at,
      summary: hit.story_text ? stripHtml(hit.story_text) : undefined,
      score: hit.points ?? undefined,
      imageUrl: undefined as string | undefined,
    };
  });

  // OG enrich top HN stories (they link to real articles with og:image)
  const top = articles.filter((a) => a.url && !a.url.includes("ycombinator.com")).slice(0, OG_ENRICH_LIMIT);
  const ogResults = await Promise.allSettled(top.map((a) => fetchOgImage(a.url)));
  ogResults.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) {
      top[i].imageUrl = result.value;
    }
  });

  return articles;
}

// ── Aggregator ────────────────────────────────────────────────────────────────

async function fetchAllArticles(): Promise<Article[]> {
  const settled = await Promise.allSettled(
    sources.map((src) => {
      if (src.format === "hn-algolia") {
        return withTimeout(fetchHackerNews(), FETCH_TIMEOUT_MS * 3);
      }
      return withTimeout(
        fetchRssAtom(src.name, src.url, src.category),
        FETCH_TIMEOUT_MS * 3
      );
    })
  );

  const all: Article[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      console.error(
        `[fetcher] ${sources[i].name} failed:`,
        result.reason?.message ?? result.reason
      );
    }
  });

  const seen = new Set<string>();
  const deduped = all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  return deduped.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// ── Cached export ─────────────────────────────────────────────────────────────

export const getCachedArticles = unstable_cache(
  fetchAllArticles,
  ["all-articles-v2"],
  { revalidate: 1800, tags: ["articles"] }
);

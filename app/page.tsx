import Link from "next/link";
import Header from "@/components/Header";
import FeedClient from "@/components/FeedClient";
import type { Article } from "@/lib/types";

export const revalidate = 1800;

async function getArticles(): Promise<{ articles: Article[]; fetchedAt: string } | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/feed`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const data = await getArticles();

  if (!data) {
    return (
      <>
        <Header />
        <main
          style={{
            maxWidth: "640px",
            margin: "8rem auto",
            padding: "0 1.5rem",
            textAlign: "center",
            color: "hsl(var(--text-muted))",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "1.25rem" }} aria-hidden>
            📡
          </div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "hsl(var(--text))",
              margin: "0 0 0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            Feed unavailable right now
          </h1>
          <p style={{ fontSize: "0.9375rem", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
            The aggregator couldn&apos;t load articles. This usually resolves
            on its own — try refreshing in a moment.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--text))",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            Retry
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <FeedClient articles={data.articles} fetchedAt={data.fetchedAt} />
    </>
  );
}

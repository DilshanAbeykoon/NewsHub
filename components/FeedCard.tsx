import type { Article } from "@/lib/types";

export type CardSize = "hero" | "featured" | "regular";

const CATEGORY_CSS: Record<string, string> = {
  research:   "var(--c-research)",
  industry:   "var(--c-industry)",
  tools:      "var(--c-tools)",
  discussion: "var(--c-discussion)",
};

const CATEGORY_LABEL: Record<string, string> = {
  research:   "Research",
  industry:   "Industry",
  tools:      "Tools",
  discussion: "Discussion",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`;
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface FeedCardProps {
  article: Article;
  size?: CardSize;
}

export default function FeedCard({ article, size = "regular" }: FeedCardProps) {
  const catVar = CATEGORY_CSS[article.category];
  const isHero = size === "hero";
  const isFeatured = size === "featured";

  const aspectRatio = isHero ? "21/9" : isFeatured ? "16/9" : "16/9";
  const imageHeight = isHero ? "420px" : isFeatured ? "220px" : "180px";

  return (
    <article
      className="card-img-wrap"
      style={{
        backgroundColor: "hsl(var(--bg-card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "4px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "border-color 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = `hsl(${catVar})`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
      }}
    >
      {/* Image / gradient */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden
        style={{ display: "block", flexShrink: 0 }}
      >
        <div
          className={`card-image ${!article.imageUrl ? `grad-${article.category}` : ""}`}
          style={{
            aspectRatio,
            height: imageHeight,
            maxHeight: imageHeight,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            /* Gradient placeholder with initial */
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 900,
                fontSize: isHero ? "5rem" : "3rem",
                color: "rgba(255,255,255,0.15)",
                letterSpacing: "-0.04em",
                userSelect: "none",
              }}>
                {article.source.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          {/* Category badge — overlay on image */}
          <div style={{
            position: "absolute",
            top: "0.75rem",
            left: "0.75rem",
          }}>
            <span style={{
              display: "inline-block",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "0.625rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: article.imageUrl ? "#fff" : "rgba(255,255,255,0.9)",
              backgroundColor: article.imageUrl
                ? `hsl(${catVar})`
                : "rgba(0,0,0,0.35)",
              padding: "0.25rem 0.5rem",
              borderRadius: "2px",
              backdropFilter: article.imageUrl ? "none" : "blur(4px)",
            }}>
              {CATEGORY_LABEL[article.category]}
            </span>
          </div>
        </div>
      </a>

      {/* Text content */}
      <div style={{
        padding: isHero ? "1.25rem 1.5rem 1.5rem" : "0.875rem 1rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        flexGrow: 1,
      }}>
        {/* Title */}
        <h2 style={{
          margin: 0,
          fontFamily: "var(--font-sans)",
          fontWeight: 800,
          fontSize: isHero ? "1.625rem" : isFeatured ? "1.125rem" : "0.9375rem",
          lineHeight: 1.3,
          letterSpacing: isHero ? "-0.03em" : "-0.015em",
          color: "hsl(var(--text))",
        }}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "inherit",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = `hsl(${catVar})`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "hsl(var(--text))";
            }}
          >
            {article.title}
          </a>
        </h2>

        {/* Summary — hero + featured only */}
        {article.summary && (isHero || isFeatured) && (
          <p style={{
            margin: 0,
            fontSize: isHero ? "0.9375rem" : "0.8125rem",
            lineHeight: 1.65,
            color: "hsl(var(--text-secondary))",
            display: "-webkit-box",
            WebkitLineClamp: isHero ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {article.summary}
          </p>
        )}

        {/* Meta row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          flexWrap: "wrap",
          marginTop: "auto",
          paddingTop: "0.25rem",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: `hsl(${catVar})`,
            letterSpacing: "0.02em",
          }}>
            {article.source}
          </span>
          <span style={{ color: "hsl(var(--border-strong))", fontSize: "0.625rem" }}>·</span>
          <time
            dateTime={article.publishedAt}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "hsl(var(--text-muted))",
            }}
          >
            {relativeTime(article.publishedAt)}
          </time>
          {article.score != null && (
            <>
              <span style={{ color: "hsl(var(--border-strong))", fontSize: "0.625rem" }}>·</span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "hsl(var(--text-muted))",
              }}>
                ▲ {article.score}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

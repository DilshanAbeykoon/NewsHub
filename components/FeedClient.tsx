"use client";

import { useState, useMemo } from "react";
import type { Article, Category } from "@/lib/types";
import FilterBar from "./FilterBar";
import FeedCard from "./FeedCard";

interface FeedClientProps {
  articles: Article[];
  fetchedAt: string;
}

export default function FeedClient({ articles, fetchedAt }: FeedClientProps) {
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = articles;
    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, activeCategory, search]);

  const isFiltering = activeCategory !== "all" || search.trim().length > 0;

  // Prefer articles with images for hero/featured slots
  const sorted = useMemo(() => {
    if (isFiltering) return filtered;
    const withImage = filtered.filter((a) => a.imageUrl);
    const withoutImage = filtered.filter((a) => !a.imageUrl);
    // Put image-having articles first for layout, but keep overall newest-first intention
    // by only promoting the first 3 slots
    const promoted = withImage.slice(0, 3);
    const rest = [
      ...withImage.slice(3),
      ...withoutImage,
    ].filter((a) => !promoted.includes(a));
    return [...promoted, ...rest];
  }, [filtered, isFiltering]);

  const hero = !isFiltering ? sorted[0] : null;
  const featured = !isFiltering ? sorted.slice(1, 3) : [];
  const grid = !isFiltering ? sorted.slice(3) : sorted;

  const lastUpdated = new Date(fetchedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <FilterBar
        active={activeCategory}
        search={search}
        onCategoryChange={setActiveCategory}
        onSearchChange={setSearch}
        totalCount={articles.length}
      />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        {/* Status bar */}
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "hsl(var(--text-muted))",
          letterSpacing: "0.04em",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
          <span>
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "all" && ` · ${activeCategory}`}
            {search && ` matching "${search}"`}
          </span>
          <span>Updated {lastUpdated}</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState search={search} category={activeCategory} />
        ) : isFiltering ? (
          /* Flat grid when filtering / searching */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}>
            {grid.map((a) => <FeedCard key={a.id} article={a} size="regular" />)}
          </div>
        ) : (
          /* Editorial layout: hero → 2-up featured → full grid */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Hero + sidebar */}
            {hero && (
              <div style={{
                display: "grid",
                gridTemplateColumns: featured.length > 0 ? "1fr 340px" : "1fr",
                gap: "1rem",
                alignItems: "stretch",
              }}
                className="hero-row"
              >
                <FeedCard article={hero} size="hero" />

                {featured.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {featured.map((a) => (
                      <FeedCard key={a.id} article={a} size="featured" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            {grid.length > 0 && (
              <div style={{
                borderTop: "2px solid hsl(var(--text))",
                paddingTop: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "0.6875rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "hsl(var(--text-muted))",
                }}>
                  Latest
                </span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "hsl(var(--border))" }} />
              </div>
            )}

            {/* Main grid */}
            {grid.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              }}>
                {grid.map((a) => (
                  <FeedCard key={a.id} article={a} size="regular" />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function EmptyState({ search, category }: { search: string; category: Category | "all" }) {
  const isFiltered = search || category !== "all";
  return (
    <div role="status" style={{
      textAlign: "center",
      padding: "6rem 1rem",
      color: "hsl(var(--text-muted))",
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        border: "2px solid hsl(var(--border-strong))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 1.25rem",
        fontSize: "1.25rem",
      }}>
        {isFiltered ? "∅" : "◌"}
      </div>
      <p style={{ fontWeight: 700, fontSize: "1rem", color: "hsl(var(--text))", margin: "0 0 0.5rem" }}>
        {isFiltered ? "No articles match" : "Feed loading…"}
      </p>
      <p style={{ fontSize: "0.875rem", margin: 0, lineHeight: 1.6 }}>
        {isFiltered
          ? "Try clearing the search or choosing a different category."
          : "The aggregator is warming up — refresh in a moment."}
      </p>
    </div>
  );
}

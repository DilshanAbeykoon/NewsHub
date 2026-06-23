"use client";

import type { Category } from "@/lib/types";

const CATEGORIES: { value: Category | "all"; label: string; color: string }[] = [
  { value: "all",        label: "All",        color: "var(--text)" },
  { value: "research",   label: "Research",   color: "var(--c-research)" },
  { value: "industry",   label: "Industry",   color: "var(--c-industry)" },
  { value: "tools",      label: "Tools",      color: "var(--c-tools)" },
  { value: "discussion", label: "Discussion", color: "var(--c-discussion)" },
];

interface FilterBarProps {
  active: Category | "all";
  search: string;
  onCategoryChange: (c: Category | "all") => void;
  onSearchChange: (s: string) => void;
  totalCount: number;
}

export default function FilterBar({
  active,
  search,
  onCategoryChange,
  onSearchChange,
  totalCount,
}: FilterBarProps) {
  return (
    <div style={{
      borderBottom: "1px solid hsl(var(--border))",
      backgroundColor: "hsl(var(--bg))",
      position: "sticky",
      top: "107px",    /* below header ~107px */
      zIndex: 30,
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0",
        height: "48px",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {/* Category tabs */}
        <div
          role="group"
          aria-label="Filter by category"
          style={{ display: "flex", alignItems: "stretch", flexShrink: 0, height: "100%" }}
        >
          {CATEGORIES.map(({ value, label, color }) => {
            const isActive = active === value;
            return (
              <button
                key={value}
                onClick={() => onCategoryChange(value)}
                aria-pressed={isActive}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0 0.875rem",
                  border: "none",
                  borderBottom: isActive
                    ? `2px solid hsl(${color})`
                    : "2px solid transparent",
                  backgroundColor: "transparent",
                  fontFamily: "var(--font-mono)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.6875rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isActive ? `hsl(${color})` : "hsl(var(--text-muted))",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                  marginBottom: "-1px",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = `hsl(${color})`;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = "hsl(var(--text-muted))";
                }}
              >
                {value !== "all" && (
                  <span style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: `hsl(${color})`,
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.5,
                  }} aria-hidden />
                )}
                {label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: "1rem" }} />

        {/* Search */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <span style={{
            position: "absolute",
            left: "0.625rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "hsl(var(--text-muted))",
            fontSize: "0.75rem",
            pointerEvents: "none",
          }}>
            ⌕
          </span>
          <label htmlFor="feed-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
            Search articles
          </label>
          <input
            id="feed-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${totalCount} articles`}
            style={{
              paddingLeft: "1.75rem",
              paddingRight: "0.75rem",
              height: "30px",
              borderRadius: "3px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--bg-secondary))",
              color: "hsl(var(--text))",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              width: "200px",
              outline: "none",
              transition: "border-color 0.15s ease, width 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--c-research))";
              e.currentTarget.style.width = "240px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "hsl(var(--border))";
              e.currentTarget.style.width = "200px";
            }}
          />
        </div>
      </div>
    </div>
  );
}

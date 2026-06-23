"use client";

import Link from "next/link";
import { useSyncExternalStore, useEffect, useState } from "react";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getSnapshot = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
const getServerSnapshot = () => false;

export default function Header() {
  const sysDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [override, setOverride] = useState<boolean | null>(null);
  const dark = override ?? sysDark;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  return (
    <header style={{
      backgroundColor: "hsl(var(--bg))",
      borderBottom: "1px solid hsl(var(--border))",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Top bar */}
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 1.5rem",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
            <span style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 900,
              fontSize: "1.375rem",
              letterSpacing: "-0.04em",
              color: "hsl(var(--text))",
              lineHeight: 1,
            }}>
              AI
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 400,
              fontSize: "0.6875rem",
              letterSpacing: "0.12em",
              color: "hsl(var(--accent))",
              textTransform: "uppercase",
            }}>
              Signal Desk
            </span>
          </div>
        </Link>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "hsl(var(--text-muted))",
            letterSpacing: "0.06em",
            display: "none",
          }}
            className="tagline"
          >
            RESEARCH · INDUSTRY · TOOLS · DISCUSSION
          </span>

          <button
            onClick={() => setOverride((o) => !(o ?? sysDark))}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--bg-secondary))",
              color: "hsl(var(--text-secondary))",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              transition: "border-color 0.15s, background-color 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border-strong))";
              (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--bg-hover))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
              (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--bg-secondary))";
            }}
          >
            {dark ? "☀" : "☽"}
          </button>
        </div>
      </div>

      {/* Category nav strip */}
      <div style={{
        borderTop: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--bg))",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          gap: "0",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {[
            { label: "All", color: "var(--text-muted)" },
            { label: "Research", color: "var(--c-research)" },
            { label: "Industry", color: "var(--c-industry)" },
            { label: "Tools", color: "var(--c-tools)" },
            { label: "Discussion", color: "var(--c-discussion)" },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: `hsl(${color})`,
                padding: "0.5rem 1rem 0.5rem 0",
                marginRight: "1rem",
                whiteSpace: "nowrap",
                opacity: 0.7,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

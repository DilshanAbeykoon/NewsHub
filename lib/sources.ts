import type { Category } from "./types";

export interface Source {
  name: string;
  url: string;
  category: Category;
  format: "rss" | "atom" | "hn-algolia";
}

export const sources: Source[] = [
  // ── Research ────────────────────────────────────────────────────────────────
  {
    name: "arXiv cs.AI",
    url: "https://rss.arxiv.org/rss/cs.AI",
    category: "research",
    format: "atom",
  },
  {
    name: "arXiv cs.LG",
    url: "https://rss.arxiv.org/rss/cs.LG",
    category: "research",
    format: "atom",
  },
  {
    name: "arXiv cs.CL",
    url: "https://rss.arxiv.org/rss/cs.CL",
    category: "research",
    format: "atom",
  },

  // ── Discussion ───────────────────────────────────────────────────────────────
  {
    name: "Hacker News",
    url: "https://hn.algolia.com/api/v1/search?query=AI+LLM+machine+learning&tags=story&hitsPerPage=30",
    category: "discussion",
    format: "hn-algolia",
  },

  // ── Industry ─────────────────────────────────────────────────────────────────
  {
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    category: "industry",
    format: "rss",
  },
  {
    name: "Google DeepMind Blog",
    url: "https://deepmind.google/blog/rss.xml",
    category: "industry",
    format: "rss",
  },
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    category: "industry",
    format: "rss",
  },
  {
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/feed/",
    category: "industry",
    format: "rss",
  },
  // ── Tools ─────────────────────────────────────────────────────────────────────
  {
    name: "Towards Data Science",
    url: "https://towardsdatascience.com/feed",
    category: "tools",
    format: "rss",
  },
  {
    name: "The Gradient",
    url: "https://thegradient.pub/rss/",
    category: "tools",
    format: "rss",
  },
];

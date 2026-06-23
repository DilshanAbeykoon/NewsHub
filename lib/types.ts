export type Category = "research" | "industry" | "tools" | "discussion";

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  category: Category;
  publishedAt: string;
  summary?: string;
  score?: number;
  imageUrl?: string;
}

import type { Category, Condition, TicketType } from "@/lib/categories";

export type ListingDraftRequest = {
  title: string;
  category: string;
  condition: string;
  notes: string;
};

export type PriceSuggestion = {
  lowCents: number;
  highCents: number;
  rationale: string;
};

/** What the seller sees. Never includes the API key or raw model payload. */
export type ListingDraft = {
  title: string;
  description: string;
  category: Category;
  ticketType: TicketType | null;
  condition: Condition;
  seniorMoveOut: boolean;
  priceCents: number;
  price: PriceSuggestion;
  source: "grok" | "mock";
};

export type AssistantResult =
  | { ok: true; draft: ListingDraft }
  | { ok: false; error: string };

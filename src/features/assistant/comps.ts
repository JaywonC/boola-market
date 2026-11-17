import type { Category, Condition, TicketType } from "@/lib/categories";

export type CompListing = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: Category;
  ticketType: TicketType | null;
  condition: Condition;
  status: string;
};

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "from",
  "with",
  "my",
  "to",
  "of",
  "in",
  "on",
  "it",
  "is",
  "at",
  "up",
  "you",
  "your",
]);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP.has(word));
}

export function overlapScore(notes: string, listing: CompListing): number {
  const words = new Set(tokens(notes));
  if (!words.size) return 0;
  let score = 0;
  for (const word of tokens(listing.title)) {
    if (words.has(word)) score += 2;
  }
  for (const word of tokens(listing.description)) {
    if (words.has(word)) score += 1;
  }
  return score;
}

/** Prefer listings that share the seller’s words, then a spread of active categories. */
export function selectComps(listings: CompListing[], notes: string, limit = 6): CompListing[] {
  const ranked = listings
    .map((listing) => ({
      listing,
      score: overlapScore(notes, listing) + (listing.status === "active" ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.listing.priceCents - b.listing.priceCents);

  const matched = ranked.filter((row) => row.score > 1);
  if (matched.length) {
    return matched.slice(0, limit).map((row) => row.listing);
  }
  return diverse(listings, limit);
}

function diverse(listings: CompListing[], limit: number): CompListing[] {
  const active = listings.filter((listing) => listing.status === "active");
  const source = active.length ? active : listings;
  const picked: CompListing[] = [];
  const seen = new Set<string>();
  for (const listing of source) {
    if (seen.has(listing.category)) continue;
    seen.add(listing.category);
    picked.push(listing);
  }
  for (const listing of source) {
    if (picked.length >= limit) break;
    if (!picked.includes(listing)) picked.push(listing);
  }
  return picked.slice(0, limit);
}

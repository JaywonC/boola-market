import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  type Category,
  type Condition,
  type TicketType,
} from "@/lib/categories";
import { formatMoney } from "@/lib/format";

import { overlapScore, type CompListing } from "@/features/assistant/comps";
import { clampPrice } from "@/features/assistant/parse";
import type { ListingDraft, PriceSuggestion } from "@/features/assistant/types";

const DEFAULT_CENTS: Record<Category, number> = {
  tickets: 4000,
  furniture: 5000,
  textbooks: 2500,
  electronics: 7000,
  clothing: 3000,
  other: 2000,
};

const CONDITION_FACTOR: Record<Condition, number> = {
  new: 1.08,
  like_new: 1,
  good: 0.9,
  fair: 0.72,
};

type Facts = {
  category: Category;
  ticketType: TicketType | null;
  condition: Condition;
  seniorMoveOut: boolean;
};

export function inferFacts(notes: string): Facts {
  const text = notes.toLowerCase();
  let category: Category = "other";
  let ticketType: TicketType | null = null;

  if (/\byso\b|woolsey/.test(text)) {
    category = "tickets";
    ticketType = "yso";
  } else if (/harvard|the game|yale bowl/.test(text)) {
    category = "tickets";
    ticketType = "harvard_yale";
  } else if (/\bconcert\b|whiffenpoof|\bwhiff\b/.test(text)) {
    category = "tickets";
    ticketType = "concerts";
  } else if (/\btickets?\b|dramat/.test(text)) {
    category = "tickets";
    ticketType = "other";
  } else if (
    /\b(mini fridge|fridge|refrigerator|monitor|laptop|lamp|charger|phone|iphone|ipad|airpods?|headphones?|speaker|computer|tv)\b/.test(
      text,
    )
  ) {
    category = "electronics";
  } else if (/\b(loft|mattress|desk|chair|dresser|shelf|bookcase|bookshelf|furniture|rug|bedframe|bed frame)\b/.test(text)) {
    category = "furniture";
  } else if (/\b(textbook|textbooks|chem|econ|cpsc|klein|edition|notes)\b/.test(text)) {
    category = "textbooks";
  } else if (/\b(dress|crewneck|jacket|shirt|shoes|sneakers|formal|hoodie|jeans|sweater|coat)\b/.test(text)) {
    category = "clothing";
  }

  let condition: Condition = "good";
  if (/like[\s-]?new|worn once|barely used|mint/.test(text)) condition = "like_new";
  else if (/\bnew\b|unopened|unused|never worn|brand new|unworn/.test(text)) condition = "new";
  else if (/\b(fair|scratch|scratched|dented|dent|stain|stained|ripped|heavily)\b/.test(text)) condition = "fair";
  else if (category === "tickets") condition = "new";

  const seniorMoveOut = /\b(move[-\s]?out|senior|leaving|graduate|graduating|graduation|loft)\b/.test(text);
  return { category, ticketType, condition, seniorMoveOut };
}

export function buildMockDraft(input: {
  notes: string;
  hasPhoto: boolean;
  listings: CompListing[];
}): ListingDraft {
  const notes = input.notes.trim().replace(/\s+/g, " ");
  const facts = inferFacts(notes);
  const suggestion = suggestPrice(notes, facts, input.listings);
  const title = toTitle(notes, facts.category, input.hasPhoto);
  const description = toDescription(notes, facts, input.hasPhoto);

  return {
    title,
    description,
    category: facts.category,
    ticketType: facts.ticketType,
    condition: facts.condition,
    seniorMoveOut: facts.seniorMoveOut,
    priceCents: suggestion.priceCents,
    price: suggestion.price,
    source: "mock",
  };
}

export function suggestPrice(
  notes: string,
  facts: Facts,
  listings: CompListing[],
): { priceCents: number; price: PriceSuggestion } {
  const pool = pricePool(listings, facts.category, facts.ticketType);
  if (!pool.length) {
    const priceCents = clampPrice(DEFAULT_CENTS[facts.category] * CONDITION_FACTOR[facts.condition]);
    const lowCents = clampPrice(priceCents * 0.85);
    const highCents = clampPrice(priceCents * 1.15);
    return {
      priceCents,
      price: {
        lowCents: Math.min(lowCents, priceCents),
        highCents: Math.max(highCents, priceCents),
        rationale: oneLine(
          `No similar ${CATEGORY_LABELS[facts.category].toLowerCase()} listings yet, so ${formatMoney(priceCents)} is a starting ask for ${CONDITION_LABELS[facts.condition].toLowerCase()} condition.`,
        ),
      },
    };
  }

  const closest = closestComp(notes, pool);
  const sameCondition = pool.filter((listing) => listing.condition === facts.condition);
  const basePool = sameCondition.length ? sameCondition : pool;
  const anchored =
    closest && overlapScore(notes, closest) >= 4
      ? adjustCondition(closest.priceCents, closest.condition, facts.condition)
      : median(basePool.map((listing) => listing.priceCents));
  const priceCents = clampPrice(anchored);
  const prices = pool.map((listing) => listing.priceCents);
  const lowCents = Math.min(priceCents, ...prices);
  const highCents = Math.max(priceCents, ...prices);
  const range =
    lowCents === highCents
      ? formatMoney(lowCents)
      : `${formatMoney(lowCents)}–${formatMoney(highCents)}`;
  const rationale = closest
    ? `“${closest.title}” is listed at ${formatMoney(closest.priceCents)}, and similar listings ask ${range}, so ${formatMoney(priceCents)} is a fair ask.`
    : `Similar listings on campus ask ${range}, so ${formatMoney(priceCents)} is a fair ask.`;

  return {
    priceCents,
    price: {
      lowCents,
      highCents,
      rationale: oneLine(rationale),
    },
  };
}

function pricePool(listings: CompListing[], category: Category, ticketType: TicketType | null): CompListing[] {
  const inCategory = listings.filter((listing) => listing.category === category);
  const active = inCategory.filter((listing) => listing.status === "active");
  const source = active.length ? active : inCategory;
  if (!ticketType) return source;
  const sameTicket = source.filter((listing) => listing.ticketType === ticketType);
  return sameTicket.length ? sameTicket : source;
}

function closestComp(notes: string, pool: CompListing[]): CompListing | null {
  let best: CompListing | null = null;
  let bestScore = 0;
  for (const listing of pool) {
    const score = overlapScore(notes, listing);
    if (score > bestScore) {
      best = listing;
      bestScore = score;
    }
  }
  return best;
}

function adjustCondition(cents: number, from: Condition, to: Condition): number {
  if (from === to) return cents;
  return cents * (CONDITION_FACTOR[to] / CONDITION_FACTOR[from]);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

function toTitle(notes: string, category: Category, hasPhoto: boolean): string {
  if (!notes) return hasPhoto ? "Campus item from a photo" : "Campus listing";
  let text = notes.replace(/[.!?]+$/, "");
  text = text.replace(/\bharvard\s*[-–]?\s*yale\b/gi, "Harvard–Yale");
  text = text.replace(/\byso\b/gi, "YSO");
  text = text.replace(/\bthe game\b/gi, "The Game");
  text = text.replace(/\byale bowl\b/gi, "Yale Bowl");
  if (/^[a-z]/.test(text)) text = text.charAt(0).toUpperCase() + text.slice(1);
  if (text.length > 90) {
    const cut = text.slice(0, 87);
    text = `${cut.replace(/\s+\S*$/, "")}…`;
  }
  if (text.length < 4) {
    text = `${CATEGORY_LABELS[category]}: ${text}`.slice(0, 90);
  }
  return text;
}

function toDescription(notes: string, facts: Facts, hasPhoto: boolean): string {
  const lead = notes
    ? /[.!?]$/.test(notes)
      ? capitalize(notes)
      : `${capitalize(notes)}.`
    : "Photo of something for sale on campus.";
  const condition = `It’s in ${CONDITION_LABELS[facts.condition].toLowerCase()} condition.`;
  const photo = hasPhoto ? "The photo shows it as it is now." : "";
  const handoff =
    facts.category === "tickets"
      ? "I can transfer it the same day you pay, and I can meet on campus first."
      : facts.category === "textbooks"
        ? "I can leave it at the Bass circulation desk or hand it off after class."
        : facts.category === "electronics"
          ? "It works as described. You haul it, and I’ll meet you at the college."
          : facts.category === "clothing"
            ? "Pickup is on campus. I’m not shipping clothes."
            : "Pickup is on campus. Message me with your college and a time.";
  const moveOut = facts.seniorMoveOut ? "This is senior move-out, so it needs to go before I leave." : "";
  return [lead, condition, photo, handoff, moveOut].filter(Boolean).join(" ");
}

function capitalize(value: string): string {
  if (!/^[a-z]/.test(value)) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function oneLine(value: string): string {
  const line = value.replace(/\s+/g, " ").trim();
  return line.length > 240 ? `${line.slice(0, 239)}…` : line;
}

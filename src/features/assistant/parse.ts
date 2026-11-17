import { isCategory, isCondition, isTicketType } from "@/lib/categories";

import { redactSecrets } from "@/features/assistant/redact";
import type { ListingDraft, PriceSuggestion } from "@/features/assistant/types";

export type ParsedDraft = Omit<ListingDraft, "source">;

export function parseModelDraft(
  raw: string,
  secrets: readonly string[] = [],
): { ok: true; draft: ParsedDraft } | { ok: false; error: string } {
  let value: unknown;
  try {
    value = extractJson(redactSecrets(raw, secrets));
  } catch {
    return { ok: false, error: "Grok’s reply was not a listing. Try again." };
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Grok’s reply was not a listing. Try again." };
  }
  const record = value as Record<string, unknown>;

  const categoryRaw = String(record.category ?? "").trim().toLowerCase();
  if (!isCategory(categoryRaw)) {
    return { ok: false, error: "Grok picked a category this marketplace doesn’t use. Try again." };
  }

  const conditionRaw = String(record.condition ?? "").trim().toLowerCase();
  if (!isCondition(conditionRaw)) {
    return { ok: false, error: "Grok picked a condition this marketplace doesn’t use. Try again." };
  }

  const title = cleanLine(record.title, 90);
  if (title.length < 4) {
    return { ok: false, error: "Grok’s title was too short. Try adding a few more words." };
  }

  const description = cleanBlock(record.description, 2000);
  if (description.length < 20) {
    return { ok: false, error: "Grok’s description was too short. Try adding a few more words." };
  }

  const rawCents = readCents(record);
  if (rawCents == null) {
    return { ok: false, error: "Grok didn’t return a price. Try again." };
  }
  const priceCents = boundRaw(rawCents);

  let ticketType: ParsedDraft["ticketType"] = null;
  if (categoryRaw === "tickets") {
    const ticketRaw = String(record.ticketType ?? "").trim().toLowerCase();
    ticketType = isTicketType(ticketRaw) ? ticketRaw : "other";
  }

  const low = boundRaw(readNumber(record.priceLowCents) ?? priceCents);
  const high = boundRaw(readNumber(record.priceHighCents) ?? priceCents);
  const price: PriceSuggestion = {
    lowCents: Math.min(low, high, priceCents),
    highCents: Math.max(low, high, priceCents),
    rationale: oneLine(record.reason ?? record.rationale, 240) || "Priced from similar listings on campus.",
  };

  return {
    ok: true,
    draft: {
      title,
      description,
      category: categoryRaw,
      ticketType,
      condition: conditionRaw,
      seniorMoveOut: record.seniorMoveOut === true || record.seniorMoveOut === "true",
      priceCents,
      price,
    },
  };
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(body.slice(start, end + 1));
    throw new Error("not json");
  }
}

function readCents(record: Record<string, unknown>): number | null {
  const cents = readNumber(record.priceCents);
  if (cents != null) return cents;
  const dollars = readNumber(record.priceDollars ?? record.price);
  if (dollars != null) return Math.round(dollars * 100);
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Math.round(Number(value));
  }
  return null;
}

export function clampPrice(cents: number): number {
  const dollars = Math.round(cents / 100);
  return Math.min(999900, Math.max(100, dollars * 100));
}

/** Keep a model number intact so a later step can tell $90 (90) from 90 cents. */
function boundRaw(cents: number): number {
  const rounded = Math.round(cents);
  if (!Number.isFinite(rounded)) return 100;
  return Math.min(999900, Math.max(1, rounded));
}

function cleanLine(value: unknown, max: number): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanBlock(value: unknown, max: number): string {
  return String(value ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

function oneLine(value: unknown, max: number): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

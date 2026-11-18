import { formatMoney } from "@/lib/format";

import type { CompListing } from "@/features/assistant/comps";

export function formatComps(comps: CompListing[]): string {
  if (!comps.length) return "No comparable listings are on the marketplace yet.";
  return comps
    .map((comp) => {
      const ticket = comp.ticketType ? `/${comp.ticketType}` : "";
      const blurb = comp.description.replace(/\s+/g, " ").slice(0, 160);
      return `- ${formatMoney(comp.priceCents)} · ${comp.category}${ticket} · ${comp.condition} · ${comp.status} · ${comp.title} — ${blurb}`;
    })
    .join("\n");
}

export function buildPrompt(input: { notes: string; hasPhoto: boolean; comps: CompListing[] }): {
  system: string;
  user: string;
} {
  const system = [
    "You write classified listings for a Yale student marketplace.",
    "Reply with one JSON object and no markdown.",
    "Fields:",
    "title (string, 4 to 90 characters),",
    "description (string, 20 to 2000 characters, specific, first person, how to hand it off),",
    "category (tickets, furniture, textbooks, electronics, clothing, or other),",
    "ticketType (yso, harvard_yale, concerts, other, or null when the category is not tickets),",
    "condition (new, like_new, good, or fair),",
    "seniorMoveOut (boolean, true for graduation move-out furniture and dorm stuff),",
    "priceCents (integer cents; 9000 means $90, never 90),",
    "priceLowCents and priceHighCents (integer cents spanning the comps),",
    "reason (one line, no newline, naming the comparable price).",
    "Anchor the price to the comparable listings. Do not invent a price far from them unless the item is clearly different.",
  ].join(" ");

  const notes = input.notes.trim() || "(no words, use the photo)";
  const user = [
    input.hasPhoto ? "A photo is attached. Describe that item." : "No photo was attached.",
    `Seller notes: ${notes}`,
    "Comparable listings already on the marketplace:",
    formatComps(input.comps),
  ].join("\n\n");

  return { system, user };
}

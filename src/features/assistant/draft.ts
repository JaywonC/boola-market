import { selectComps, type CompListing } from "@/features/assistant/comps";
import { completeGrok, type ChatMessage } from "@/features/assistant/grok";
import { buildMockDraft } from "@/features/assistant/mock";
import { clampPrice, parseModelDraft } from "@/features/assistant/parse";
import { buildPrompt } from "@/features/assistant/prompt";
import { containsSecret, redactSecrets } from "@/features/assistant/redact";
import type { AssistantResult, ListingDraft } from "@/features/assistant/types";

export type DraftImage = { mime: string; base64: string };

/**
 * Builds a listing draft. `apiKey` is passed in by the server action.
 * A missing key uses campus comps. The return value never includes the key.
 */
export async function createDraft(input: {
  notes: string;
  hasPhoto: boolean;
  image?: DraftImage | null;
  listings: CompListing[];
  apiKey: string | null;
  model: string;
  fetchImpl?: typeof fetch;
}): Promise<AssistantResult> {
  const notes = input.notes.trim().slice(0, 2000);
  if (!notes && !input.hasPhoto) {
    return { ok: false, error: "Add a photo or a few words first." };
  }

  const comps = selectComps(input.listings, notes);
  if (!input.apiKey) {
    return { ok: true, draft: publicDraft(buildMockDraft({ notes, hasPhoto: input.hasPhoto, listings: input.listings })) };
  }

  const prompt = buildPrompt({ notes, hasPhoto: input.hasPhoto, comps });
  const userMessage: ChatMessage = input.image
    ? {
        role: "user",
        content: [
          { type: "text", text: prompt.user },
          { type: "image_url", image_url: { url: `data:${input.image.mime};base64,${input.image.base64}` } },
        ],
      }
    : { role: "user", content: prompt.user };

  const completed = await completeGrok({
    apiKey: input.apiKey,
    model: input.model,
    messages: [{ role: "system", content: prompt.system }, userMessage],
    fetchImpl: input.fetchImpl,
  });
  if (!completed.ok) return completed;

  const parsed = parseModelDraft(completed.content, [input.apiKey]);
  if (!parsed.ok) return parsed;

  const priceCents = alignPriceToComps(parsed.draft.priceCents, comps);
  const lowCents = Math.min(alignPriceToComps(parsed.draft.price.lowCents, comps), priceCents);
  const highCents = Math.max(alignPriceToComps(parsed.draft.price.highCents, comps), priceCents);
  const draft: ListingDraft = publicDraft({
    ...parsed.draft,
    priceCents,
    price: {
      lowCents,
      highCents,
      rationale: redactSecrets(parsed.draft.price.rationale, [input.apiKey]),
    },
    source: "grok",
  });

  if (containsSecret(draft, input.apiKey)) {
    return { ok: false, error: "The draft was discarded because it included a secret." };
  }
  return { ok: true, draft };
}

export function alignPriceToComps(priceCents: number, comps: CompListing[]): number {
  if (!comps.length) return clampPrice(priceCents);
  const mid = median(comps.map((listing) => listing.priceCents));
  let cents = priceCents;
  const asDollars = cents * 100;
  if (cents > 0 && cents < 1000 && asDollars > mid * 0.2 && asDollars < mid * 4) {
    cents = asDollars;
  }
  return clampPrice(cents);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

function publicDraft(draft: ListingDraft): ListingDraft {
  return {
    title: draft.title,
    description: draft.description,
    category: draft.category,
    ticketType: draft.ticketType,
    condition: draft.condition,
    seniorMoveOut: draft.seniorMoveOut,
    priceCents: draft.priceCents,
    price: {
      lowCents: draft.price.lowCents,
      highCents: draft.price.highCents,
      rationale: draft.price.rationale,
    },
    source: draft.source,
  };
}

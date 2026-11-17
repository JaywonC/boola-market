/**
 * Grok listing writer.
 * The create form mounts ListingAssistantSlot, which calls writeListingWithGrok.
 * XAI_API_KEY is read only in env.server.ts, from that server action.
 */
export const ASSISTANT_PLUGIN = {
  id: "assistant",
  slot: "src/features/assistant/components/listing-assistant-slot.tsx",
  action: "src/features/assistant/actions.ts",
  form: "src/features/listings/components/listing-form.tsx",
} as const;

export type { AssistantResult, ListingDraft, ListingDraftRequest, PriceSuggestion } from "@/features/assistant/types";
export { selectComps } from "@/features/assistant/comps";
export { buildMockDraft } from "@/features/assistant/mock";
export { parseModelDraft } from "@/features/assistant/parse";

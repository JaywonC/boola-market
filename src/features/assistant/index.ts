/**
 * Grok-powered listing writing and price suggestions.
 * ListingAssistantSlot is mounted on the create form and currently renders nothing.
 * Replace that component, then call into this module.
 */
export const ASSISTANT_PLUGIN = {
  id: "assistant",
  slot: "src/features/assistant/components/listing-assistant-slot.tsx",
  form: "src/features/listings/components/listing-form.tsx",
} as const;

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

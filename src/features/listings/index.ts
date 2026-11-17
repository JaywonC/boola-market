/** Listings: browse, detail, and create. Validation lives in schema.ts. */
export const LISTINGS_PLUGIN = {
  id: "listings",
  form: "src/features/listings/components/listing-form.tsx",
  card: "src/features/listings/components/listing-card.tsx",
  write: "src/features/listings/actions.ts",
} as const;

/** Buyer reviews of a seller after a completed order. Profiles already render them. */
export const REVIEWS_PLUGIN = {
  id: "reviews",
  entry: "src/app/profile/[id]/page.tsx",
  write: "src/features/reviews/actions.ts",
  rules: "src/features/reviews/rules.ts",
} as const;

export { evaluateReview } from "@/features/reviews/rules";

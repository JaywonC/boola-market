/** Buyer reviews of a seller after a completed order. */
export const REVIEWS_PLUGIN = {
  id: "reviews",
  entry: "src/app/profile/[id]/page.tsx",
  write: "src/features/reviews/actions.ts",
  rules: "src/features/reviews/rules.ts",
  badge: "src/features/reviews/components/trust-badge.tsx",
  profileBadge: "src/features/reviews/components/verified-yalie.tsx",
} as const;

export { evaluateReview, REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from "@/features/reviews/rules";
export { openReviews } from "@/features/reviews/eligibility";

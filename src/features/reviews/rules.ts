import type { OrderStatus } from "@/lib/categories";

export const REVIEW_MIN_LENGTH = 12;
export const REVIEW_MAX_LENGTH = 400;

export type ReviewDecision = { ok: true } | { ok: false; error: string };

/** A review is allowed only from the buyer, only after that sale is completed, and only once. */
export function evaluateReview(input: {
  orderStatus: OrderStatus;
  buyerId: string;
  reviewerId: string;
  sellerId: string;
  rating: number;
  body: string;
  alreadyReviewed: boolean;
}): ReviewDecision {
  if (input.orderStatus !== "completed") {
    return { ok: false, error: "Reviews open after the sale is completed." };
  }
  if (input.reviewerId !== input.buyerId) {
    return { ok: false, error: "Only the buyer reviews the seller." };
  }
  if (input.reviewerId === input.sellerId) {
    return { ok: false, error: "Sellers don’t review their own sales." };
  }
  if (input.alreadyReviewed) {
    return { ok: false, error: "This sale already has a review." };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Rate the seller from 1 to 5." };
  }
  const body = input.body.trim();
  if (body.length < REVIEW_MIN_LENGTH) {
    return { ok: false, error: "Write a short note about the seller — at least a sentence." };
  }
  if (body.length > REVIEW_MAX_LENGTH) {
    return { ok: false, error: `Keep the review under ${REVIEW_MAX_LENGTH} characters.` };
  }
  return { ok: true };
}

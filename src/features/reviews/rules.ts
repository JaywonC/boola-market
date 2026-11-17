import type { OrderStatus } from "@/lib/categories";

export type ReviewDecision = { ok: true } | { ok: false; error: string };

export function evaluateReview(input: {
  orderStatus: OrderStatus;
  buyerId: string;
  reviewerId: string;
  rating: number;
  alreadyReviewed: boolean;
}): ReviewDecision {
  if (input.orderStatus !== "completed") {
    return { ok: false, error: "Reviews open after the sale is completed." };
  }
  if (input.reviewerId !== input.buyerId) {
    return { ok: false, error: "Only the buyer reviews the seller." };
  }
  if (input.alreadyReviewed) {
    return { ok: false, error: "This sale already has a review." };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: "Rate the seller from 1 to 5." };
  }
  return { ok: true };
}

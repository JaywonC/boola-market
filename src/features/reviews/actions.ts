"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/auth/session";
import { insertReview, readStore } from "@/lib/db/store";

export type ReviewFormState = {
  error: string;
  done: boolean;
};

/** Buyer review of a seller after a completed order. */
export async function reviewSeller(orderId: string, rating: number, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertReview({ orderId, reviewerId: user.id, rating, body });
  if (!result.ok) return result;

  revalidatePath(`/profile/${result.review.sellerId}`);
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/move-out");
  const store = await readStore();
  for (const listing of store.listings) {
    if (listing.sellerId === result.review.sellerId) {
      revalidatePath(`/listings/${listing.id}`);
    }
  }
  return result;
}

/** Form action. Returns only what the form renders. */
export async function submitSellerReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  if (!/^\d+$/.test(ratingRaw)) {
    return { error: "Rate the seller from 1 to 5.", done: false };
  }
  const result = await reviewSeller(orderId, Number(ratingRaw), body);
  if (!result.ok) return { error: result.error, done: false };
  return { error: "", done: true };
}

"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/auth/session";
import { insertReview } from "@/lib/db/store";

/** Buyer review of a seller after a completed order. Wire a form on the profile or order. */
export async function reviewSeller(orderId: string, rating: number, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertReview({ orderId, reviewerId: user.id, rating, body });
  if (result.ok) revalidatePath(`/profile/${result.review.sellerId}`);
  return result;
}

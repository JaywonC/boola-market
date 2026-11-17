"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/auth/session";
import { insertOrder } from "@/lib/db/store";
import type { OrderStatus } from "@/lib/categories";

/** Checkout is not in this slice. Call recordOrder when a buyer and seller agree. */
export async function recordOrder(listingId: string, priceCents: number, status: OrderStatus = "pending") {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertOrder({ listingId, buyerId: user.id, priceCents, status });
  if (result.ok) {
    revalidatePath(`/listings/${listingId}`);
    revalidatePath(`/profile/${result.order.sellerId}`);
  }
  return result;
}

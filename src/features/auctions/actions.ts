"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/auth/session";
import { insertBid } from "@/lib/db/store";

/**
 * Live auctions plug-in.
 * Call this from a bid form on the listing page. Realtime updates, anti-snipe,
 * and countdown sync are still open — this writes a validated bid to the store.
 */
export async function placeBid(listingId: string, amountCents: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertBid({ listingId, bidderId: user.id, amountCents });
  if (result.ok) revalidatePath(`/listings/${listingId}`);
  return result;
}

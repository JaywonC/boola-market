"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/features/auth/session";
import { insertMessage } from "@/lib/db/store";

/**
 * Haggling chat plug-in.
 * The listing page already shows stored threads. A composer should call this.
 */
export async function sendMessage(listingId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertMessage({ listingId, senderId: user.id, body });
  if (result.ok) revalidatePath(`/listings/${listingId}`);
  return result;
}

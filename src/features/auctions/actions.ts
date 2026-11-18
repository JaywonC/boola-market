"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { insertBid } from "@/lib/db/store";

/**
 * Live auctions.
 * placeBid validates a bid. submitBid is the listing form: it redirects back
 * with the validation message so the page works even before client JS attaches.
 */
export async function placeBid(listingId: string, amountCents: number) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertBid({ listingId, bidderId: user.id, amountCents });
  if (result.ok) revalidatePath(`/listings/${listingId}`);
  return result;
}

export async function submitBid(formData: FormData) {
  const listingId = String(formData.get("listingId") ?? "");
  const raw = String(formData.get("amount") ?? "").trim().replace(/^\$/, "");
  const dollars = Number(raw);
  const back = `/listings/${listingId}`;
  if (!raw || !Number.isFinite(dollars) || dollars <= 0) {
    redirect(`${back}?bidError=${encodeURIComponent("Enter a bid in dollars.")}`);
  }
  const result = await placeBid(listingId, Math.round(dollars * 100));
  if (!result.ok) {
    redirect(`${back}?bidError=${encodeURIComponent(result.error)}`);
  }
  redirect(back);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { quoteDelivery, recommendCourier } from "@/features/delivery/pricing";
import { isCollege } from "@/lib/colleges";
import { acceptDelivery, becomeCourier, createCollegeDelivery, readStore } from "@/lib/db/store";

export type DeliveryActionState = { error: string };

export async function requestDelivery(
  _previous: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const user = await getCurrentUser();
  const listingId = String(formData.get("listingId") ?? "");
  if (!user) redirect(`/login?next=/listings/${listingId}`);
  const toCollege = String(formData.get("toCollege") ?? "");
  if (!isCollege(toCollege)) return { error: "Pick a residential college." };

  const store = await readStore();
  const listing = store.listings.find((item) => item.id === listingId);
  const seller = listing ? store.users.find((item) => item.id === listing.sellerId) : null;
  if (!listing || !seller) return { error: "That listing is gone." };

  const quote = quoteDelivery(seller.college, toCollege);
  const couriers = store.couriers.flatMap((courier) => {
    const person = store.users.find((item) => item.id === courier.userId);
    if (!person) return [];
    return [{ ...courier, college: person.college, name: person.name }];
  });
  const assigned = recommendCourier(couriers, toCollege, [user.id, seller.id]);
  const created = await createCollegeDelivery({
    listingId,
    buyerId: user.id,
    toCollege,
    feeCents: quote.feeCents,
    etaMinutes: quote.etaMinutes,
    courierId: assigned?.userId ?? null,
  });
  if (!created.ok) return { error: created.error };

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/couriers");
  revalidatePath("/browse");
  redirect(`/listings/${listingId}?delivery=requested`);
}

export async function optInAsCourier() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/couriers");
  await becomeCourier(user.id);
  revalidatePath("/couriers");
  redirect("/couriers?joined=1");
}

export async function takeDelivery(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/couriers");
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const result = await acceptDelivery(deliveryId, user.id);
  if (!result.ok) redirect(`/couriers?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/couriers");
  revalidatePath(`/listings/${result.delivery.listingId}`);
  redirect("/couriers?accepted=1");
}

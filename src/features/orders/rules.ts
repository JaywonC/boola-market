import type { ListingStatus } from "@/lib/categories";

export type OrderDecision = { ok: true } | { ok: false; error: string };

export function evaluateOrder(input: {
  listingStatus: ListingStatus;
  sellerId: string;
  buyerId: string;
  priceCents: number;
  existing: boolean;
}): OrderDecision {
  if (input.listingStatus !== "active") {
    return { ok: false, error: "This listing isn’t available." };
  }
  if (input.sellerId === input.buyerId) {
    return { ok: false, error: "You can’t buy your own listing." };
  }
  if (!Number.isInteger(input.priceCents) || input.priceCents <= 0) {
    return { ok: false, error: "The sale needs a price." };
  }
  if (input.existing) {
    return { ok: false, error: "This listing already has an open or completed sale." };
  }
  return { ok: true };
}

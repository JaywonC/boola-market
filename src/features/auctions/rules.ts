import type { ListingStatus, ListingType } from "@/lib/categories";

export type BidDecision = { ok: true } | { ok: false; reason: string };

export function evaluateBid(input: {
  status: ListingStatus;
  listingType: ListingType;
  sellerId: string;
  bidderId: string;
  startPriceCents: number;
  auctionEndsAt: string | null;
  highestBidCents: number | null;
  amountCents: number;
  nowMs: number;
}): BidDecision {
  if (input.listingType !== "auction") {
    return { ok: false, reason: "This listing has a fixed price." };
  }
  if (input.status !== "active") {
    return { ok: false, reason: "This auction is not open." };
  }
  if (input.sellerId === input.bidderId) {
    return { ok: false, reason: "You can’t bid on your own listing." };
  }
  const ends = input.auctionEndsAt ? Date.parse(input.auctionEndsAt) : Number.NaN;
  if (!Number.isFinite(ends) || ends <= input.nowMs) {
    return { ok: false, reason: "This auction has ended." };
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, reason: "Enter a whole-cent bid." };
  }
  if (input.highestBidCents == null) {
    if (input.amountCents < input.startPriceCents) {
      return { ok: false, reason: "Bid at least the starting price." };
    }
  } else if (input.amountCents <= input.highestBidCents) {
    return { ok: false, reason: "Bid more than the current high bid." };
  }
  return { ok: true };
}

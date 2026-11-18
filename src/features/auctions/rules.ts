import type { ListingStatus, ListingType } from "@/lib/categories";

/** Each new bid must beat the current high bid by at least this much. */
export const MIN_BID_INCREMENT_CENTS = 500;

export type BidDecision = { ok: true } | { ok: false; reason: string };

export function minimumNextBidCents(startPriceCents: number, highestBidCents: number | null) {
  if (highestBidCents == null) return startPriceCents;
  return highestBidCents + MIN_BID_INCREMENT_CENTS;
}

function money(cents: number) {
  const dollars = cents / 100;
  return cents % 100 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

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
  const minimum = minimumNextBidCents(input.startPriceCents, input.highestBidCents);
  if (input.amountCents < minimum) {
    if (input.highestBidCents == null) {
      return { ok: false, reason: `Bid at least the starting price of ${money(minimum)}.` };
    }
    return {
      ok: false,
      reason: `Bid at least ${money(minimum)}. The minimum raise is ${money(MIN_BID_INCREMENT_CENTS)}.`,
    };
  }
  return { ok: true };
}

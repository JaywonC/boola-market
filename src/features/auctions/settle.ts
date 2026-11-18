import type { Order, StoreData } from "@/lib/db/types";

/** Close auctions whose end time has passed and record the high bidder as winner. */
export function settleExpiredAuctions(store: StoreData, nowMs: number) {
  let changed = false;
  for (const listing of store.listings) {
    if (listing.listingType !== "auction" || listing.status !== "active") continue;
    const ends = listing.auctionEndsAt ? Date.parse(listing.auctionEndsAt) : Number.NaN;
    if (!Number.isFinite(ends) || ends > nowMs) continue;

    const bids = store.bids.filter((bid) => bid.listingId === listing.id);
    if (bids.length === 0) {
      listing.status = "cancelled";
      listing.auctionWinnerId = null;
      changed = true;
      continue;
    }

    const winner = bids.reduce((best, bid) => (bid.amountCents > best.amountCents ? bid : best));
    listing.status = "sold";
    listing.auctionWinnerId = winner.bidderId;
    const already = store.orders.some(
      (order) => order.listingId === listing.id && order.status !== "cancelled",
    );
    if (!already) {
      const order: Order = {
        id: `ord_win_${listing.id}`,
        listingId: listing.id,
        buyerId: winner.bidderId,
        sellerId: listing.sellerId,
        priceCents: winner.amountCents,
        status: "pending",
        createdAt: new Date(nowMs).toISOString(),
      };
      store.orders.push(order);
    }
    changed = true;
  }
  return changed;
}

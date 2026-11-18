import { getCurrentUser } from "@/features/auth/session";
import { minimumNextBidCents, MIN_BID_INCREMENT_CENTS } from "@/features/auctions/rules";
import type { College } from "@/lib/colleges";
import { readStoreForRender } from "@/lib/db/store";

export type AuctionSnapshot = {
  listingId: string;
  status: "active" | "sold" | "cancelled";
  endsAt: string;
  startPriceCents: number;
  highBidCents: number | null;
  minNextCents: number;
  incrementCents: number;
  ended: boolean;
  winner: { id: string; name: string; college: string } | null;
  bids: Array<{
    id: string;
    bidderId: string;
    name: string;
    college: string;
    amountCents: number;
    createdAt: string;
  }>;
  viewerId: string | null;
  viewerIsSeller: boolean;
  viewerIsWinner: boolean;
  sellerCollege: College;
  /** Server clock for the first paint, so the countdown matches the HTML. */
  serverNow: number;
};

export async function getAuctionSnapshot(listingId: string): Promise<AuctionSnapshot | null> {
  const store = await readStoreForRender();
  const listing = store.listings.find((item) => item.id === listingId);
  if (!listing || listing.listingType !== "auction" || !listing.auctionEndsAt) return null;
  const seller = store.users.find((user) => user.id === listing.sellerId);
  if (!seller) return null;
  const viewer = await getCurrentUser();
  const bids = store.bids
    .filter((bid) => bid.listingId === listing.id)
    .sort((a, b) => b.amountCents - a.amountCents || b.createdAt.localeCompare(a.createdAt))
    .flatMap((bid) => {
      const bidder = store.users.find((user) => user.id === bid.bidderId);
      if (!bidder) return [];
      return [
        {
          id: bid.id,
          bidderId: bidder.id,
          name: bidder.name,
          college: bidder.college,
          amountCents: bid.amountCents,
          createdAt: bid.createdAt,
        },
      ];
    });
  const highBidCents = bids[0]?.amountCents ?? null;
  const winnerUser = listing.auctionWinnerId
    ? store.users.find((user) => user.id === listing.auctionWinnerId)
    : null;
  const serverNow = Date.now();
  const ended = listing.status !== "active" || Date.parse(listing.auctionEndsAt) <= serverNow;
  return {
    listingId: listing.id,
    status: listing.status,
    endsAt: listing.auctionEndsAt,
    startPriceCents: listing.priceCents,
    highBidCents,
    minNextCents: minimumNextBidCents(listing.priceCents, highBidCents),
    incrementCents: MIN_BID_INCREMENT_CENTS,
    ended,
    winner: winnerUser ? { id: winnerUser.id, name: winnerUser.name, college: winnerUser.college } : null,
    bids,
    viewerId: viewer?.id ?? null,
    viewerIsSeller: viewer?.id === listing.sellerId,
    viewerIsWinner: Boolean(viewer && listing.auctionWinnerId === viewer.id),
    sellerCollege: seller.college,
    serverNow,
  };
}

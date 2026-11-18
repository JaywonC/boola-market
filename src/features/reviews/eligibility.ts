import type { Listing, Order, Review } from "@/lib/db/types";

export type ReviewOpportunity = {
  orderId: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  priceCents: number;
  completedAt: string;
};

/** Completed sales this buyer has not reviewed yet. */
export function openReviews(input: {
  orders: Order[];
  reviews: Review[];
  listings: Listing[];
  buyerId: string;
  sellerId?: string;
  listingId?: string;
}): ReviewOpportunity[] {
  const reviewed = new Set(input.reviews.map((review) => review.orderId));
  const listings = new Map(input.listings.map((listing) => [listing.id, listing]));

  return input.orders
    .filter((order) => order.status === "completed" && order.buyerId === input.buyerId)
    .filter((order) => (input.sellerId ? order.sellerId === input.sellerId : true))
    .filter((order) => (input.listingId ? order.listingId === input.listingId : true))
    .filter((order) => !reviewed.has(order.id))
    .flatMap((order) => {
      const listing = listings.get(order.listingId);
      if (!listing) return [];
      return [
        {
          orderId: order.id,
          listingId: listing.id,
          listingTitle: listing.title,
          sellerId: order.sellerId,
          priceCents: order.priceCents,
          completedAt: order.createdAt,
        },
      ];
    })
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

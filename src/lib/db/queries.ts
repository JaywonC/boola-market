import { activeEvents, derivedEventId } from "@/lib/events";
import type { Bid, Listing, Message, Review, StoreData, User } from "@/lib/db/types";
import { readStore, readStoreForRender } from "@/lib/db/store";

export type ListingCard = {
  listing: Listing;
  seller: User;
  highBidCents: number | null;
  bidCount: number;
  sellerRating: number | null;
  sellerReviewCount: number;
  sellerSales: number;
  displayPriceCents: number;
};

export type ListingDetail = ListingCard & {
  bids: Array<Bid & { bidder: User }>;
  threads: Array<{
    id: string;
    buyer: User;
    messages: Array<Message & { sender: User }>;
  }>;
};

export type ProfileModel = {
  user: User;
  rating: number | null;
  reviewCount: number;
  completedSales: number;
  listings: ListingCard[];
  reviews: Array<Review & { reviewer: User; listingTitle: string }>;
};

export type BrowseFilters = {
  q?: string;
  category?: string;
  ticket?: string;
  type?: string;
  college?: string;
  sort?: string;
  moveout?: string;
  event?: string;
  status?: string;
};

function sellerStats(store: StoreData, userId: string) {
  const reviews = store.reviews.filter((review) => review.sellerId === userId);
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;
  const completedSales = store.orders.filter(
    (order) => order.sellerId === userId && order.status === "completed",
  ).length;
  return { rating, reviewCount: reviews.length, completedSales };
}

function toCard(store: StoreData, listing: Listing): ListingCard | null {
  const seller = store.users.find((user) => user.id === listing.sellerId);
  if (!seller) return null;
  const bids = store.bids.filter((bid) => bid.listingId === listing.id);
  const highBidCents = bids.length ? Math.max(...bids.map((bid) => bid.amountCents)) : null;
  const stats = sellerStats(store, seller.id);
  const displayPriceCents =
    listing.listingType === "auction" ? (highBidCents ?? listing.priceCents) : listing.priceCents;
  return {
    listing,
    seller,
    highBidCents,
    bidCount: bids.length,
    sellerRating: stats.rating,
    sellerReviewCount: stats.reviewCount,
    sellerSales: stats.completedSales,
    displayPriceCents,
  };
}

export function cardsFromStore(store: StoreData) {
  return store.listings
    .map((listing) => toCard(store, listing))
    .filter((card): card is ListingCard => card !== null);
}

export async function getMarketplaceStats() {
  const store = await readStoreForRender();
  const ratings = store.reviews.map((review) => review.rating);
  return {
    students: store.users.length,
    activeListings: store.listings.filter((listing) => listing.status === "active").length,
    completedSales: store.orders.filter((order) => order.status === "completed").length,
    averageRating: ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null,
  };
}

export async function getHomeFeed() {
  const store = await readStoreForRender();
  const cards = cardsFromStore(store).filter((card) => card.listing.status === "active");
  const featured = cards
    .filter((card) => card.listing.category === "tickets")
    .sort((a, b) => ticketRank(a.listing.ticketType) - ticketRank(b.listing.ticketType))
    .slice(0, 4);
  const moveOut = cards
    .filter((card) => card.listing.seniorMoveOut)
    .sort((a, b) => b.listing.createdAt.localeCompare(a.listing.createdAt))
    .slice(0, 3);
  const fresh = [...cards]
    .sort((a, b) => b.listing.createdAt.localeCompare(a.listing.createdAt))
    .slice(0, 6);
  const ratings = store.reviews.map((review) => review.rating);
  return {
    stats: {
      students: store.users.length,
      activeListings: cards.length,
      completedSales: store.orders.filter((order) => order.status === "completed").length,
      averageRating: ratings.length
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null,
    },
    featured,
    moveOut,
    fresh,
    events: activeEvents().map((event) => ({
      ...event,
      count: cards.filter((card) => derivedEventId(card.listing) === event.id).length,
    })),
  };
}

function ticketRank(ticketType: Listing["ticketType"]) {
  if (ticketType === "harvard_yale") return 0;
  if (ticketType === "yso") return 1;
  if (ticketType === "concerts") return 2;
  return 3;
}

export async function queryListings(filters: BrowseFilters) {
  const store = await readStoreForRender();
  const q = filters.q?.trim().toLowerCase() ?? "";
  let cards = cardsFromStore(store);

  const status = filters.status || "active";
  if (status !== "all") {
    cards = cards.filter((card) => card.listing.status === status);
  }
  if (filters.category) {
    cards = cards.filter((card) => card.listing.category === filters.category);
  }
  if (filters.ticket) {
    cards = cards.filter((card) => card.listing.ticketType === filters.ticket);
  }
  if (filters.type === "fixed" || filters.type === "auction") {
    cards = cards.filter((card) => card.listing.listingType === filters.type);
  }
  if (filters.college) {
    cards = cards.filter((card) => card.seller.college === filters.college);
  }
  if (filters.moveout === "1") {
    cards = cards.filter((card) => card.listing.seniorMoveOut);
  }
  if (filters.event) {
    cards = cards.filter((card) => derivedEventId(card.listing) === filters.event);
  }
  if (q) {
    cards = cards.filter((card) => {
      const haystack = [
        card.listing.title,
        card.listing.description,
        card.listing.category,
        card.listing.ticketType ?? "",
        card.seller.name,
        card.seller.college,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  const sort = filters.sort || "newest";
  cards.sort((a, b) => {
    if (sort === "price_asc") return a.displayPriceCents - b.displayPriceCents;
    if (sort === "price_desc") return b.displayPriceCents - a.displayPriceCents;
    return b.listing.createdAt.localeCompare(a.listing.createdAt);
  });

  return cards;
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const store = await readStoreForRender();
  const listing = store.listings.find((item) => item.id === id);
  if (!listing) return null;
  const card = toCard(store, listing);
  if (!card) return null;
  const bids = store.bids
    .filter((bid) => bid.listingId === listing.id)
    .sort((a, b) => b.amountCents - a.amountCents)
    .flatMap((bid) => {
      const bidder = store.users.find((user) => user.id === bid.bidderId);
      return bidder ? [{ ...bid, bidder }] : [];
    });
  const threads = store.conversations
    .filter((conversation) => conversation.listingId === listing.id)
    .flatMap((conversation) => {
      const buyer = store.users.find((user) => user.id === conversation.buyerId);
      if (!buyer) return [];
      const messages = store.messages
        .filter((message) => message.conversationId === conversation.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .flatMap((message) => {
          const sender = store.users.find((user) => user.id === message.senderId);
          return sender ? [{ ...message, sender }] : [];
        });
      return [{ id: conversation.id, buyer, messages }];
    });
  return { ...card, bids, threads };
}

export async function getProfile(id: string): Promise<ProfileModel | null> {
  const store = await readStoreForRender();
  const user = store.users.find((item) => item.id === id);
  if (!user) return null;
  const stats = sellerStats(store, user.id);
  const listings = cardsFromStore(store)
    .filter((card) => card.listing.sellerId === user.id)
    .sort((a, b) => b.listing.createdAt.localeCompare(a.listing.createdAt));
  const reviews = store.reviews
    .filter((review) => review.sellerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((review) => {
      const reviewer = store.users.find((item) => item.id === review.reviewerId);
      const order = store.orders.find((item) => item.id === review.orderId);
      const sold = store.listings.find((item) => item.id === order?.listingId);
      if (!reviewer || !sold) return [];
      return [{ ...review, reviewer, listingTitle: sold.title }];
    });
  return {
    user,
    rating: stats.rating,
    reviewCount: stats.reviewCount,
    completedSales: stats.completedSales,
    listings,
    reviews,
  };
}

export async function getUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email === email.trim().toLowerCase()) ?? null;
}

export async function getUserById(id: string) {
  const store = await readStore();
  return store.users.find((user) => user.id === id) ?? null;
}

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";

import { evaluateBid } from "@/features/auctions/rules";
import { settleExpiredAuctions } from "@/features/auctions/settle";
import { evaluateThreadPost } from "@/features/messages/rules";
import { evaluateOrder } from "@/features/orders/rules";
import { evaluateReview } from "@/features/reviews/rules";
import type { College } from "@/lib/colleges";
import { derivedEventId } from "@/lib/events";
import type {
  Bid,
  Conversation,
  Delivery,
  Listing,
  Message,
  Order,
  Review,
  StoreData,
  User,
} from "@/lib/db/types";
import { buildSeed } from "@/lib/db/seed";
import { supabaseNotReady } from "@/lib/db/supabase";

const FILE = path.join(process.cwd(), "data", "store.json");

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

async function load(): Promise<StoreData> {
  if (process.env.DATA_PROVIDER === "supabase") supabaseNotReady();
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.listings)) {
      throw new Error("The local store at data/store.json is unreadable. Delete it to reseed the demo.");
    }
    if (normalizeStore(parsed)) await persist(parsed);
    return parsed;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    const seeded = buildSeed();
    normalizeStore(seeded);
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
}

function normalizeStore(store: StoreData) {
  let changed = false;
  if (!Array.isArray(store.couriers)) {
    store.couriers = [];
    changed = true;
  }
  if (!Array.isArray(store.deliveries)) {
    store.deliveries = [];
    changed = true;
  }
  if (store.deliveries.length === 0 || store.couriers.length === 0) {
    const seed = buildSeed();
    for (const user of seed.users) {
      if (!store.users.some((item) => item.id === user.id)) {
        store.users.push(user);
        changed = true;
      }
    }
    for (const listing of seed.listings) {
      if (!listing.id.startsWith("lst_drop_")) continue;
      if (!store.listings.some((item) => item.id === listing.id)) {
        store.listings.push(listing);
        changed = true;
      }
    }
    for (const order of seed.orders) {
      if (!order.id.startsWith("ord_drop_")) continue;
      if (!store.orders.some((item) => item.id === order.id)) {
        store.orders.push(order);
        changed = true;
      }
    }
    if (store.couriers.length === 0) {
      store.couriers = seed.couriers;
      changed = true;
    }
    if (store.deliveries.length === 0) {
      store.deliveries = seed.deliveries;
      changed = true;
    }
  }

  const game = store.listings.find((listing) => listing.id === "lst_game_pair");
  if (game && game.status === "active" && game.listingType === "auction") {
    const end = Date.parse(game.auctionEndsAt ?? "");
    const hours = (end - Date.now()) / 36e5;
    if (!Number.isFinite(hours) || hours < 1 || hours > 6) {
      game.auctionEndsAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      changed = true;
    }
  }

  const seeded = buildSeed();
  const seededPhotos = new Map(seeded.listings.filter((item) => item.photos.length > 0).map((item) => [item.id, item.photos]));
  for (const listing of store.listings) {
    if (!listing.event) {
      const event = derivedEventId({ ...listing, event: null });
      if (event) {
        listing.event = event;
        changed = true;
      }
    }
    if (listing.photos.length === 0) {
      const photos = seededPhotos.get(listing.id);
      if (photos) {
        listing.photos = [...photos];
        changed = true;
      }
    }
  }
  for (const user of store.users) {
    if (user.avatarUrl) continue;
    const seededUser = seeded.users.find((item) => item.id === user.id);
    if (!seededUser?.avatarUrl) continue;
    user.avatarUrl = seededUser.avatarUrl;
    changed = true;
  }

  if (settleExpiredAuctions(store, Date.now())) changed = true;
  return changed;
}

async function persist(store: StoreData) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2));
}

/** Request-time read. Pages should call this from inside <Suspense>. */
export async function readStoreForRender() {
  await connection();
  return withLock(load);
}

export async function readStore() {
  return withLock(load);
}

export async function insertUser(input: {
  email: string;
  name: string;
  college: College;
  graduationYear: number;
}) {
  return withLock(async () => {
    const store = await load();
    const email = input.email.trim().toLowerCase();
    if (store.users.some((user) => user.email === email)) {
      return {
        ok: false as const,
        error: "That Yale email already has an account. Request another magic link to sign in.",
      };
    }
    const user: User = {
      id: createId("usr"),
      email,
      name: input.name.trim(),
      college: input.college,
      graduationYear: input.graduationYear,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    await persist(store);
    return { ok: true as const, user };
  });
}

export async function insertListing(
  input: Omit<Listing, "id" | "createdAt" | "status" | "photos"> & { photos: string[] },
) {
  return withLock(async () => {
    const store = await load();
    if (!store.users.some((user) => user.id === input.sellerId)) {
      return { ok: false as const, error: "Sign in again before listing." };
    }
    const listing: Listing = {
      ...input,
      id: createId("lst"),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    store.listings.push(listing);
    await persist(store);
    return { ok: true as const, listing };
  });
}

export async function insertBid(input: { listingId: string; bidderId: string; amountCents: number }) {
  return withLock(async () => {
    const store = await load();
    const listing = store.listings.find((item) => item.id === input.listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    const amounts = store.bids
      .filter((bid) => bid.listingId === listing.id)
      .map((bid) => bid.amountCents);
    const decision = evaluateBid({
      status: listing.status,
      listingType: listing.listingType,
      sellerId: listing.sellerId,
      bidderId: input.bidderId,
      startPriceCents: listing.priceCents,
      auctionEndsAt: listing.auctionEndsAt,
      highestBidCents: amounts.length ? Math.max(...amounts) : null,
      amountCents: input.amountCents,
      nowMs: Date.now(),
    });
    if (!decision.ok) return { ok: false as const, error: decision.reason };
    const bid: Bid = {
      id: createId("bid"),
      listingId: listing.id,
      bidderId: input.bidderId,
      amountCents: input.amountCents,
      createdAt: new Date().toISOString(),
    };
    store.bids.push(bid);
    await persist(store);
    return { ok: true as const, bid };
  });
}

function saleOpen(store: StoreData, listingId: string) {
  return store.orders.some((order) => order.listingId === listingId && order.status !== "cancelled");
}

function appendValidatedMessage(
  store: StoreData,
  conversation: Conversation,
  listing: Listing,
  senderId: string,
  body: string,
) {
  const prior = store.messages
    .filter((message) => message.conversationId === conversation.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const decision = evaluateThreadPost({
    listingType: listing.listingType,
    listingStatus: listing.status,
    askingCents: listing.priceCents,
    saleOpen: saleOpen(store, listing.id),
    senderId,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    body,
    prior,
  });
  if (!decision.ok) return decision;
  const message: Message = {
    id: createId("msg"),
    conversationId: conversation.id,
    senderId,
    body: decision.body,
    createdAt: new Date().toISOString(),
  };
  store.messages.push(message);
  if (senderId === conversation.buyerId) conversation.buyerLastReadAt = message.createdAt;
  else conversation.sellerLastReadAt = message.createdAt;
  return { ok: true as const, message, conversation };
}

export async function insertMessage(input: { listingId: string; senderId: string; body: string }) {
  return withLock(async () => {
    const store = await load();
    const listing = store.listings.find((item) => item.id === input.listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    const onListing = store.conversations.filter((item) => item.listingId === listing.id);
    let conversation = onListing.find((item) => item.buyerId === input.senderId);
    if (!conversation && input.senderId === listing.sellerId) {
      if (onListing.length > 1) {
        return { ok: false as const, error: "Open the conversation from your inbox." };
      }
      conversation = onListing[0];
    }
    if (!conversation) {
      if (input.senderId === listing.sellerId) {
        return { ok: false as const, error: "Wait for a buyer to start the thread." };
      }
      conversation = {
        id: createId("conv"),
        listingId: listing.id,
        buyerId: input.senderId,
        sellerId: listing.sellerId,
        createdAt: new Date().toISOString(),
      };
      store.conversations.push(conversation);
    }
    const result = appendValidatedMessage(store, conversation, listing, input.senderId, input.body);
    if (!result.ok) return result;
    await persist(store);
    return result;
  });
}

export async function insertConversationMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
}) {
  return withLock(async () => {
    const store = await load();
    const conversation = store.conversations.find((item) => item.id === input.conversationId);
    if (!conversation) return { ok: false as const, error: "That conversation is gone." };
    const listing = store.listings.find((item) => item.id === conversation.listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    const result = appendValidatedMessage(store, conversation, listing, input.senderId, input.body);
    if (!result.ok) return result;
    await persist(store);
    return result;
  });
}

export async function openConversation(listingId: string, buyerId: string) {
  return withLock(async () => {
    const store = await load();
    const listing = store.listings.find((item) => item.id === listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    if (listing.listingType !== "fixed") {
      return { ok: false as const, error: "Haggling is for fixed-price listings." };
    }
    if (listing.status !== "active") {
      return { ok: false as const, error: "This listing isn’t available." };
    }
    if (listing.sellerId === buyerId) {
      return { ok: false as const, error: "This is your listing." };
    }
    let conversation = store.conversations.find(
      (item) => item.listingId === listing.id && item.buyerId === buyerId,
    );
    if (!conversation) {
      conversation = {
        id: createId("conv"),
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        createdAt: new Date().toISOString(),
        buyerLastReadAt: new Date().toISOString(),
      };
      store.conversations.push(conversation);
      await persist(store);
    }
    return { ok: true as const, conversation };
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  return withLock(async () => {
    const store = await load();
    const conversation = store.conversations.find((item) => item.id === conversationId);
    if (!conversation) return { ok: false as const, error: "That conversation is gone." };
    if (userId !== conversation.buyerId && userId !== conversation.sellerId) {
      return { ok: false as const, error: "Only the buyer and seller can use this thread." };
    }
    const incoming = store.messages
      .filter((message) => message.conversationId === conversation.id && message.senderId !== userId)
      .map((message) => message.createdAt)
      .sort();
    const latest = incoming.at(-1) ?? conversation.createdAt;
    const previous = userId === conversation.buyerId ? conversation.buyerLastReadAt : conversation.sellerLastReadAt;
    if (previous && previous >= latest) return { ok: true as const, changed: false as const };
    const stamp = new Date().toISOString();
    const next = stamp > latest ? stamp : latest;
    if (userId === conversation.buyerId) conversation.buyerLastReadAt = next;
    else conversation.sellerLastReadAt = next;
    await persist(store);
    return { ok: true as const, changed: true as const };
  });
}

export async function insertOrder(input: {
  listingId: string;
  buyerId: string;
  priceCents: number;
  status: Order["status"];
}) {
  return withLock(async () => {
    const store = await load();
    const listing = store.listings.find((item) => item.id === input.listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    const decision = evaluateOrder({
      listingStatus: listing.status,
      sellerId: listing.sellerId,
      buyerId: input.buyerId,
      priceCents: input.priceCents,
      existing: store.orders.some(
        (order) => order.listingId === listing.id && order.status !== "cancelled",
      ),
    });
    if (!decision.ok) return decision;
    const order: Order = {
      id: createId("ord"),
      listingId: listing.id,
      buyerId: input.buyerId,
      sellerId: listing.sellerId,
      priceCents: input.priceCents,
      status: input.status,
      createdAt: new Date().toISOString(),
    };
    store.orders.push(order);
    if (input.status === "completed") listing.status = "sold";
    await persist(store);
    return { ok: true as const, order };
  });
}

export async function insertReview(input: {
  orderId: string;
  reviewerId: string;
  rating: number;
  body: string;
}) {
  return withLock(async () => {
    const store = await load();
    const order = store.orders.find((item) => item.id === input.orderId);
    if (!order) return { ok: false as const, error: "That sale doesn’t exist." };
    const decision = evaluateReview({
      orderStatus: order.status,
      buyerId: order.buyerId,
      reviewerId: input.reviewerId,
      sellerId: order.sellerId,
      rating: input.rating,
      body: input.body,
      alreadyReviewed: store.reviews.some((review) => review.orderId === order.id),
    });
    if (!decision.ok) return decision;
    const review: Review = {
      id: createId("rev"),
      orderId: order.id,
      reviewerId: input.reviewerId,
      sellerId: order.sellerId,
      rating: input.rating,
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
    };
    store.reviews.push(review);
    await persist(store);
    return { ok: true as const, review };
  });
}

export async function createCollegeDelivery(input: {
  listingId: string;
  buyerId: string;
  toCollege: College;
  feeCents: number;
  etaMinutes: number;
  courierId: string | null;
}) {
  return withLock(async () => {
    const store = await load();
    const listing = store.listings.find((item) => item.id === input.listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    const seller = store.users.find((user) => user.id === listing.sellerId);
    if (!seller) return { ok: false as const, error: "That seller isn’t on file." };
    if (listing.sellerId === input.buyerId) {
      return { ok: false as const, error: "You can’t request delivery of your own listing." };
    }
    const duplicate = store.deliveries.some(
      (delivery) =>
        delivery.listingId === listing.id &&
        delivery.buyerId === input.buyerId &&
        delivery.status !== "cancelled",
    );
    if (duplicate) return { ok: false as const, error: "You already asked for delivery on this listing." };

    const wonAuction =
      listing.listingType === "auction" &&
      listing.status === "sold" &&
      listing.auctionWinnerId === input.buyerId;
    const fixedOpen = listing.listingType === "fixed" && listing.status === "active";
    if (!wonAuction && !fixedOpen) {
      return {
        ok: false as const,
        error: "Delivery is for a fixed-price listing, or for the winner after an auction ends.",
      };
    }

    let order = store.orders.find(
      (item) => item.listingId === listing.id && item.buyerId === input.buyerId && item.status !== "cancelled",
    );
    if (!order) {
      order = {
        id: createId("ord"),
        listingId: listing.id,
        buyerId: input.buyerId,
        sellerId: listing.sellerId,
        priceCents: wonAuction
          ? Math.max(listing.priceCents, ...store.bids.filter((bid) => bid.listingId === listing.id).map((bid) => bid.amountCents))
          : listing.priceCents,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      store.orders.push(order);
      if (fixedOpen) listing.status = "sold";
    }

    const delivery: Delivery = {
      id: createId("del"),
      orderId: order.id,
      listingId: listing.id,
      buyerId: input.buyerId,
      sellerId: listing.sellerId,
      fromCollege: seller.college,
      toCollege: input.toCollege,
      feeCents: input.feeCents,
      etaMinutes: input.etaMinutes,
      courierId: input.courierId,
      status: input.courierId ? "accepted" : "open",
      createdAt: new Date().toISOString(),
      acceptedAt: input.courierId ? new Date().toISOString() : null,
    };
    store.deliveries.push(delivery);
    await persist(store);
    return { ok: true as const, delivery };
  });
}

export async function becomeCourier(userId: string) {
  return withLock(async () => {
    const store = await load();
    const existing = store.couriers.find((courier) => courier.userId === userId);
    if (existing) {
      existing.active = true;
      await persist(store);
      return existing;
    }
    const courier = {
      userId,
      active: true,
      rating: null,
      createdAt: new Date().toISOString(),
    };
    store.couriers.push(courier);
    await persist(store);
    return courier;
  });
}

export async function acceptDelivery(deliveryId: string, courierUserId: string) {
  return withLock(async () => {
    const store = await load();
    const delivery = store.deliveries.find((item) => item.id === deliveryId);
    if (!delivery) return { ok: false as const, error: "That delivery is gone." };
    if (delivery.status !== "open") return { ok: false as const, error: "Another courier already took this one." };
    const courier = store.couriers.find((item) => item.userId === courierUserId && item.active);
    if (!courier) return { ok: false as const, error: "Turn on courier mode before accepting a handoff." };
    if (courierUserId === delivery.buyerId || courierUserId === delivery.sellerId) {
      return { ok: false as const, error: "You can’t courier your own sale." };
    }
    delivery.courierId = courierUserId;
    delivery.status = "accepted";
    delivery.acceptedAt = new Date().toISOString();
    await persist(store);
    return { ok: true as const, delivery };
  });
}

export type { Conversation };

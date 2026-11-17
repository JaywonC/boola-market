import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";

import { evaluateBid } from "@/features/auctions/rules";
import { evaluateMessage } from "@/features/messages/rules";
import { evaluateOrder } from "@/features/orders/rules";
import { evaluateReview } from "@/features/reviews/rules";
import type { College } from "@/lib/colleges";
import type {
  Bid,
  Conversation,
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
    return parsed;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
    const seeded = buildSeed();
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(seeded, null, 2));
    return seeded;
  }
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

export async function insertMessage(input: {
  listingId: string;
  senderId: string;
  body: string;
}) {
  return withLock(async () => {
    const store = await load();
    const listing = store.listings.find((item) => item.id === input.listingId);
    if (!listing) return { ok: false as const, error: "That listing is gone." };
    let conversation = store.conversations.find(
      (item) =>
        item.listingId === listing.id &&
        (item.buyerId === input.senderId || item.sellerId === input.senderId),
    );
    const buyerId = input.senderId === listing.sellerId ? conversation?.buyerId ?? "" : input.senderId;
    const decision = evaluateMessage({
      senderId: input.senderId,
      buyerId: buyerId || input.senderId,
      sellerId: listing.sellerId,
      body: input.body,
    });
    if (!decision.ok) return decision;
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
    const message: Message = {
      id: createId("msg"),
      conversationId: conversation.id,
      senderId: input.senderId,
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
    };
    store.messages.push(message);
    await persist(store);
    return { ok: true as const, message, conversation };
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
      rating: input.rating,
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

export type { Conversation };

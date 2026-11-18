import type { StoreData } from "@/lib/db/types";
import { classYear } from "@/lib/format";
import {
  annotateThread,
  hasUnread,
  previewText,
  type OfferCardState,
  type OfferKind,
} from "@/features/messages/rules";

export type InboxRow = {
  id: string;
  listingId: string;
  listingTitle: string;
  otherName: string;
  otherDetail: string;
  preview: string;
  updatedAt: string;
  unread: boolean;
  seniorMoveOut: boolean;
  agreedCents: number | null;
  askingCents: number;
};

export type ThreadMessageView = {
  id: string;
  senderId: string;
  senderName: string;
  mine: boolean;
  createdAt: string;
  note: string;
  structured: null | { kind: OfferKind; cents: number; state: OfferCardState };
};

export type ThreadView = {
  id: string;
  listingId: string;
  listingTitle: string;
  askingCents: number;
  seniorMoveOut: boolean;
  agreedCents: number | null;
  pending: { id: string; cents: number; mine: boolean; kind: "offer" | "counter" } | null;
  role: "buyer" | "seller";
  otherName: string;
  otherDetail: string;
  otherId: string;
  canOffer: boolean;
  canCounter: boolean;
  canRespond: boolean;
  canBuy: boolean;
  orderStatus: "pending" | "completed" | "cancelled" | null;
  orderCents: number | null;
  messages: ThreadMessageView[];
};

function personDetail(college: string, year: number) {
  return `${college} ${classYear(year)}`;
}

function clip(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 140) return flat;
  return `${flat.slice(0, 139)}…`;
}

export function buildInbox(store: StoreData, userId: string): InboxRow[] {
  const rows: InboxRow[] = [];
  for (const conversation of store.conversations) {
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) continue;
    const listing = store.listings.find((item) => item.id === conversation.listingId);
    const otherId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    const other = store.users.find((item) => item.id === otherId);
    if (!listing || !other) continue;
    const messages = store.messages.filter((message) => message.conversationId === conversation.id);
    const state = annotateThread(messages);
    const latest = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
    rows.push({
      id: conversation.id,
      listingId: listing.id,
      listingTitle: listing.title,
      otherName: other.name,
      otherDetail: personDetail(other.college, other.graduationYear),
      preview: latest ? clip(previewText(latest.body)) : "No messages yet",
      updatedAt: latest?.createdAt ?? conversation.createdAt,
      unread: hasUnread({
        userId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        buyerLastReadAt: conversation.buyerLastReadAt,
        sellerLastReadAt: conversation.sellerLastReadAt,
        messages,
      }),
      seniorMoveOut: listing.seniorMoveOut,
      agreedCents: state.agreedCents,
      askingCents: listing.priceCents,
    });
  }
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return rows;
}

export function countUnread(store: StoreData, userId: string) {
  return buildInbox(store, userId).filter((row) => row.unread).length;
}

export function buildThreadView(store: StoreData, conversationId: string, userId: string): ThreadView | null {
  const conversation = store.conversations.find((item) => item.id === conversationId);
  if (!conversation) return null;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) return null;
  const listing = store.listings.find((item) => item.id === conversation.listingId);
  const otherId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
  const other = store.users.find((item) => item.id === otherId);
  if (!listing || !other) return null;

  const raw = store.messages.filter((message) => message.conversationId === conversation.id);
  const state = annotateThread(raw);
  const role = conversation.buyerId === userId ? "buyer" : "seller";
  const order =
    store.orders
      .filter(
        (item) =>
          item.listingId === listing.id && item.buyerId === conversation.buyerId && item.status !== "cancelled",
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  const activeFixed = listing.status === "active" && listing.listingType === "fixed" && !order;
  const pendingMine = Boolean(state.pending && state.pending.senderId === userId);
  const pendingTheirs = Boolean(state.pending && state.pending.senderId !== userId);

  return {
    id: conversation.id,
    listingId: listing.id,
    listingTitle: listing.title,
    askingCents: listing.priceCents,
    seniorMoveOut: listing.seniorMoveOut,
    agreedCents: state.agreedCents,
    pending: state.pending
      ? {
          id: state.pending.id,
          cents: state.pending.cents,
          mine: state.pending.senderId === userId,
          kind: state.pending.kind,
        }
      : null,
    role,
    otherName: other.name,
    otherDetail: personDetail(other.college, other.graduationYear),
    otherId: other.id,
    canOffer: role === "buyer" && activeFixed && !pendingMine,
    canCounter: role === "seller" && activeFixed && pendingTheirs,
    canRespond: activeFixed && pendingTheirs,
    canBuy: role === "buyer" && activeFixed && state.agreedCents != null && !state.pending,
    orderStatus: order?.status ?? null,
    orderCents: order?.priceCents ?? null,
    messages: state.messages.map((message) => {
      const sender = store.users.find((item) => item.id === message.senderId);
      return {
        id: message.id,
        senderId: message.senderId,
        senderName: sender?.name ?? "Yale student",
        mine: message.senderId === userId,
        createdAt: message.createdAt,
        note: message.note,
        structured: message.structured,
      };
    }),
  };
}

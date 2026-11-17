import type { ListingStatus, ListingType } from "@/lib/categories";

export type MessageDecision = { ok: true; body: string } | { ok: false; error: string };

export function evaluateMessage(input: {
  senderId: string;
  buyerId: string;
  sellerId: string;
  body: string;
}): MessageDecision {
  const body = input.body.trim();
  if (input.senderId !== input.buyerId && input.senderId !== input.sellerId) {
    return { ok: false, error: "Only the buyer and seller can use this thread." };
  }
  if (body.length < 1) return { ok: false, error: "Write a message first." };
  if (body.length > 2000) return { ok: false, error: "Keep the message under 2,000 characters." };
  return { ok: true, body };
}

export type OfferKind = "offer" | "counter" | "accept" | "decline";

export type StructuredMessage = {
  kind: OfferKind;
  cents: number;
  note: string;
};

const STRUCTURED = /^\[\[ym:(offer|counter|accept|decline):(\d+)\]\](?:\n([\s\S]*))?$/;

export function parseStructuredMessage(body: string): StructuredMessage | null {
  const match = body.trim().match(STRUCTURED);
  if (!match) return null;
  const cents = Number(match[2]);
  if (!Number.isInteger(cents) || cents <= 0) return null;
  const kind = match[1];
  if (kind !== "offer" && kind !== "counter" && kind !== "accept" && kind !== "decline") return null;
  return { kind, cents, note: (match[3] ?? "").trim() };
}

export function encodeStructuredMessage(kind: OfferKind, cents: number, note = "") {
  const text = note.trim();
  return text.length > 0 ? `[[ym:${kind}:${cents}]]\n${text}` : `[[ym:${kind}:${cents}]]`;
}

/** Dollar strings such as "45", "$45", or "45.50" become cents. */
export function parseDollarsToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isInteger(cents) || cents <= 0 || cents > 10_000_000) return null;
  return cents;
}

export function formatOfferAmount(cents: number) {
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
}

export function structuredLabel(kind: OfferKind, cents: number) {
  const amount = formatOfferAmount(cents);
  if (kind === "offer") return `Offer ${amount}`;
  if (kind === "counter") return `Counter ${amount}`;
  if (kind === "accept") return `Accepted ${amount}`;
  return `Declined ${amount}`;
}

export function previewText(body: string) {
  const parsed = parseStructuredMessage(body);
  if (!parsed) return body.trim();
  const label = structuredLabel(parsed.kind, parsed.cents);
  return parsed.note ? `${label} — ${parsed.note}` : label;
}

export type ThreadMessageInput = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type OfferCardState = "pending" | "accepted" | "declined" | "superseded";

export type AnnotatedMessage = ThreadMessageInput & {
  note: string;
  structured: null | { kind: OfferKind; cents: number; state: OfferCardState };
};

export function annotateThread(messages: ThreadMessageInput[]) {
  const sorted = [...messages].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  const items: AnnotatedMessage[] = [];
  let pendingIndex: number | null = null;
  let agreedCents: number | null = null;

  for (const message of sorted) {
    const parsed = parseStructuredMessage(message.body);
    const annotated: AnnotatedMessage = {
      ...message,
      note: parsed ? parsed.note : message.body.trim(),
      structured: parsed ? { kind: parsed.kind, cents: parsed.cents, state: "pending" } : null,
    };
    if (parsed && (parsed.kind === "offer" || parsed.kind === "counter")) {
      const prior = pendingIndex == null ? undefined : items[pendingIndex];
      if (prior?.structured) prior.structured.state = "superseded";
      agreedCents = null;
      pendingIndex = items.length;
    } else if (parsed && parsed.kind === "accept") {
      const prior = pendingIndex == null ? undefined : items[pendingIndex];
      if (prior?.structured && prior.structured.cents === parsed.cents) prior.structured.state = "accepted";
      if (annotated.structured) annotated.structured.state = "accepted";
      agreedCents = parsed.cents;
      pendingIndex = null;
    } else if (parsed && parsed.kind === "decline") {
      const prior = pendingIndex == null ? undefined : items[pendingIndex];
      if (prior?.structured && prior.structured.cents === parsed.cents) prior.structured.state = "declined";
      if (annotated.structured) annotated.structured.state = "declined";
      pendingIndex = null;
    }
    items.push(annotated);
  }

  const pendingItem = pendingIndex == null ? null : items[pendingIndex];
  const pending =
    pendingItem?.structured &&
    (pendingItem.structured.kind === "offer" || pendingItem.structured.kind === "counter")
      ? {
          id: pendingItem.id,
          senderId: pendingItem.senderId,
          cents: pendingItem.structured.cents,
          kind: pendingItem.structured.kind,
        }
      : null;

  return { messages: items, pending, agreedCents };
}

export function hasUnread(input: {
  userId: string;
  buyerId: string;
  sellerId: string;
  buyerLastReadAt?: string | null;
  sellerLastReadAt?: string | null;
  messages: Array<{ senderId: string; createdAt: string }>;
}) {
  const lastRead = input.userId === input.buyerId ? input.buyerLastReadAt : input.sellerLastReadAt;
  let latestIncoming: string | null = null;
  for (const message of input.messages) {
    if (message.senderId === input.userId) continue;
    if (!latestIncoming || message.createdAt > latestIncoming) latestIncoming = message.createdAt;
  }
  if (!latestIncoming) return false;
  if (!lastRead) return true;
  return latestIncoming > lastRead;
}

export function evaluateThreadPost(input: {
  listingType: ListingType;
  listingStatus: ListingStatus;
  askingCents: number;
  saleOpen: boolean;
  senderId: string;
  buyerId: string;
  sellerId: string;
  body: string;
  prior: ThreadMessageInput[];
}): MessageDecision {
  const party = evaluateMessage({
    senderId: input.senderId,
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    body: input.body,
  });
  if (!party.ok) return party;
  const parsed = parseStructuredMessage(party.body);
  if (!parsed) return party;

  if (input.listingType !== "fixed") {
    return { ok: false, error: "Offers are for fixed-price listings." };
  }
  if (input.listingStatus !== "active") {
    return { ok: false, error: "This listing isn’t available." };
  }
  if (input.saleOpen) {
    return { ok: false, error: "This listing already has a sale in progress." };
  }
  if (!Number.isInteger(input.askingCents) || input.askingCents <= 0) {
    return { ok: false, error: "This listing doesn’t have a price." };
  }

  const { pending } = annotateThread(input.prior);
  const fromBuyer = input.senderId === input.buyerId;

  if (parsed.kind === "offer") {
    if (!fromBuyer) {
      return { ok: false, error: "The buyer makes the offer. You can counter, accept, or decline." };
    }
    if (parsed.cents >= input.askingCents) {
      return { ok: false, error: "Offer less than the asking price." };
    }
    if (pending?.senderId === input.senderId) {
      return { ok: false, error: "Wait for a reply to your current offer." };
    }
    if (pending && pending.cents === parsed.cents) {
      return { ok: false, error: "That’s the same as the current offer. Accept it, or name a different price." };
    }
    return party;
  }

  if (parsed.kind === "counter") {
    if (fromBuyer) {
      return { ok: false, error: "Send a new offer, or accept or decline the counter." };
    }
    if (!pending) return { ok: false, error: "Wait for the buyer to make an offer." };
    if (pending.senderId === input.senderId) {
      return { ok: false, error: "Wait for a reply to your current offer." };
    }
    if (parsed.cents > input.askingCents) {
      return { ok: false, error: "That counter is above the asking price." };
    }
    if (parsed.cents === pending.cents) {
      return { ok: false, error: "That’s the same as the current offer." };
    }
    return party;
  }

  if (!pending) return { ok: false, error: "There isn’t an offer to respond to." };
  if (pending.senderId === input.senderId) {
    return { ok: false, error: "You can’t respond to your own offer." };
  }
  if (parsed.cents !== pending.cents) {
    return { ok: false, error: "That offer changed. Refresh and try again." };
  }
  return party;
}

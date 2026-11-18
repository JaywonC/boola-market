import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSeed } from "../../lib/db/seed.ts";
import {
  annotateThread,
  encodeStructuredMessage,
  evaluateThreadPost,
  formatOfferAmount,
  hasUnread,
  parseDollarsToCents,
  parseStructuredMessage,
  previewText,
  structuredLabel,
  type ThreadMessageInput,
} from "./rules.ts";

const buyer = "usr_sam";
const seller = "usr_alex";

function post(overrides: Partial<Parameters<typeof evaluateThreadPost>[0]> = {}) {
  return evaluateThreadPost({
    listingType: "fixed",
    listingStatus: "active",
    askingCents: 7000,
    saleOpen: false,
    senderId: buyer,
    buyerId: buyer,
    sellerId: seller,
    body: "Hello",
    prior: [],
    ...overrides,
  });
}

function line(id: string, senderId: string, body: string, createdAt: string): ThreadMessageInput {
  return { id, senderId, body, createdAt };
}

describe("haggling offers", () => {
  it("labels a structured offer the way the button reads", () => {
    assert.equal(parseDollarsToCents("45"), 4500);
    assert.equal(parseDollarsToCents("$45.50"), 4550);
    assert.equal(parseDollarsToCents("0"), null);
    assert.equal(formatOfferAmount(4500), "$45");
    assert.equal(structuredLabel("offer", 4500), "Offer $45");
    const body = encodeStructuredMessage("offer", 4500, "Tonight?");
    assert.deepEqual(parseStructuredMessage(body), { kind: "offer", cents: 4500, note: "Tonight?" });
    assert.equal(previewText(body), "Offer $45 — Tonight?");
  });

  it("lets a buyer offer under the asking price and a seller counter", () => {
    const offer = encodeStructuredMessage("offer", 5500, "Would you take $55?");
    const offered = post({ body: offer });
    assert.equal(offered.ok, true);
    const prior = [line("1", buyer, offer, "2026-11-12T22:08:00.000Z")];
    const countered = post({
      senderId: seller,
      body: encodeStructuredMessage("counter", 6000, "I can do $60."),
      prior,
    });
    assert.equal(countered.ok, true);
    assert.equal(post({ body: encodeStructuredMessage("offer", 7000), prior: [] }).ok, false);
    assert.equal(post({ senderId: seller, body: offer, prior: [] }).ok, false);
    assert.equal(post({ body: offer, prior }).ok, false);
  });

  it("accepts only the other party’s current offer and locks that price", () => {
    const offer = encodeStructuredMessage("offer", 5500);
    const counter = encodeStructuredMessage("counter", 6000);
    const prior = [
      line("1", buyer, offer, "2026-11-12T22:08:00.000Z"),
      line("2", seller, counter, "2026-11-12T22:20:00.000Z"),
    ];
    assert.equal(post({ senderId: seller, body: encodeStructuredMessage("accept", 6000), prior }).ok, false);
    const accepted = post({ body: encodeStructuredMessage("accept", 6000), prior });
    assert.equal(accepted.ok, true);
    const done = annotateThread([
      ...prior,
      line("3", buyer, encodeStructuredMessage("accept", 6000), "2026-11-12T22:30:00.000Z"),
    ]);
    assert.equal(done.pending, null);
    assert.equal(done.agreedCents, 6000);
    assert.equal(done.messages[0]?.structured?.state, "superseded");
    assert.equal(done.messages[1]?.structured?.state, "accepted");

    const renegotiated = annotateThread([
      ...prior,
      line("3", buyer, encodeStructuredMessage("accept", 6000), "2026-11-12T22:30:00.000Z"),
      line("4", buyer, encodeStructuredMessage("offer", 5000), "2026-11-12T22:40:00.000Z"),
    ]);
    assert.equal(renegotiated.agreedCents, null);
    assert.equal(renegotiated.pending?.cents, 5000);
  });

  it("rejects a decline when nothing is pending and blocks offers once a sale is open", () => {
    assert.equal(post({ body: encodeStructuredMessage("decline", 5500) }).ok, false);
    const offer = encodeStructuredMessage("offer", 5500);
    const prior = [line("1", buyer, offer, "2026-11-12T22:08:00.000Z")];
    assert.equal(post({ senderId: seller, body: encodeStructuredMessage("decline", 5500), prior }).ok, true);
    assert.equal(post({ body: offer, saleOpen: true }).ok, false);
    assert.equal(post({ body: "I can still text about pickup.", saleOpen: true }).ok, true);
    assert.equal(post({ listingType: "auction", body: offer }).ok, false);
    assert.equal(post({ senderId: "usr_maya", body: "Hello" }).ok, false);
  });

  it("seeds an unread senior move-out fridge haggle", () => {
    const store = buildSeed();
    const fridge = store.listings.find((listing) => listing.id === "lst_fridge");
    assert.equal(fridge?.seniorMoveOut, true);
    assert.equal(fridge?.listingType, "fixed");
    const conversation = store.conversations.find((item) => item.id === "conv_fridge");
    assert.ok(conversation);
    const messages = store.messages.filter((message) => message.conversationId === "conv_fridge");
    const state = annotateThread(messages);
    assert.equal(state.pending?.cents, 6000);
    assert.equal(state.pending?.senderId, conversation.sellerId);
    assert.equal(state.agreedCents, null);
    assert.equal(
      hasUnread({
        userId: conversation.buyerId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        buyerLastReadAt: conversation.buyerLastReadAt,
        sellerLastReadAt: conversation.sellerLastReadAt,
        messages,
      }),
      true,
    );
    assert.equal(
      hasUnread({
        userId: conversation.sellerId,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        buyerLastReadAt: conversation.buyerLastReadAt,
        sellerLastReadAt: conversation.sellerLastReadAt,
        messages,
      }),
      false,
    );
    assert.ok(store.conversations.length >= 2);
  });
});

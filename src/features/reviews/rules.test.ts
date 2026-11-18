import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSeed } from "../../lib/db/seed.ts";
import { openReviews } from "./eligibility.ts";
import { evaluateReview, REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from "./rules.ts";

const valid = {
  orderStatus: "completed" as const,
  buyerId: "usr_jordan",
  reviewerId: "usr_jordan",
  sellerId: "usr_maya",
  rating: 5,
  body: "Met at Cross Campus and the beanie matched the listing.",
  alreadyReviewed: false,
};

describe("evaluateReview", () => {
  it("accepts a completed sale from the buyer", () => {
    assert.deepEqual(evaluateReview(valid), { ok: true });
  });

  it("requires a completed order, the buyer, and a first review", () => {
    assert.equal(evaluateReview({ ...valid, orderStatus: "pending" }).ok, false);
    assert.equal(evaluateReview({ ...valid, orderStatus: "cancelled" }).ok, false);
    assert.equal(evaluateReview({ ...valid, reviewerId: "usr_priya" }).ok, false);
    assert.equal(evaluateReview({ ...valid, alreadyReviewed: true }).ok, false);
    assert.equal(
      evaluateReview({ ...valid, reviewerId: "usr_maya", buyerId: "usr_maya", sellerId: "usr_maya" }).ok,
      false,
    );
  });

  it("accepts only integer ratings from 1 to 5", () => {
    assert.equal(evaluateReview({ ...valid, rating: 1 }).ok, true);
    assert.equal(evaluateReview({ ...valid, rating: 0 }).ok, false);
    assert.equal(evaluateReview({ ...valid, rating: 6 }).ok, false);
    assert.equal(evaluateReview({ ...valid, rating: 4.5 }).ok, false);
  });

  it("requires a short written note", () => {
    assert.equal(evaluateReview({ ...valid, body: "   " }).ok, false);
    assert.equal(evaluateReview({ ...valid, body: "Great" }).ok, false);
    assert.equal(evaluateReview({ ...valid, body: "x".repeat(REVIEW_MIN_LENGTH) }).ok, true);
    assert.equal(evaluateReview({ ...valid, body: "x".repeat(REVIEW_MAX_LENGTH + 1) }).ok, false);
  });
});

describe("openReviews", () => {
  it("returns only this buyer’s completed sales that have no review", () => {
    const orders = [
      order("open", "completed", "usr_jordan"),
      order("done", "completed", "usr_jordan"),
      order("wait", "pending", "usr_jordan"),
      order("other", "completed", "usr_priya"),
    ];
    const found = openReviews({
      orders,
      reviews: [
        {
          id: "rev_done",
          orderId: "ord_done",
          reviewerId: "usr_jordan",
          sellerId: "usr_maya",
          rating: 5,
          body: "Already written.",
          createdAt: "2026-10-02T00:00:00.000Z",
        },
      ],
      listings: [listing("open"), listing("done"), listing("wait"), listing("other")],
      buyerId: "usr_jordan",
      sellerId: "usr_maya",
    });
    assert.deepEqual(
      found.map((item) => item.orderId),
      ["ord_open"],
    );
  });

  it("can narrow to one listing", () => {
    const found = openReviews({
      orders: [order("open", "completed", "usr_jordan"), order("also", "completed", "usr_jordan")],
      reviews: [],
      listings: [listing("open"), listing("also")],
      buyerId: "usr_jordan",
      listingId: "lst_also",
    });
    assert.equal(found.length, 1);
    assert.equal(found[0]?.listingTitle, "Listing also");
  });
});

describe("seeded seller trust", () => {
  it("gives every active seller a written history and leaves Jordan one review to write", () => {
    const store = buildSeed();
    const activeSellers = new Set(
      store.listings.filter((listing) => listing.status === "active").map((listing) => listing.sellerId),
    );
    for (const sellerId of activeSellers) {
      const reviews = store.reviews.filter((review) => review.sellerId === sellerId);
      assert.ok(reviews.length >= 3, `${sellerId} should look established`);
    }

    for (const review of store.reviews) {
      const order = store.orders.find((item) => item.id === review.orderId);
      assert.ok(order);
      assert.equal(order?.status, "completed");
      assert.equal(review.reviewerId, order?.buyerId);
      assert.equal(review.sellerId, order?.sellerId);
      assert.equal(
        evaluateReview({
          orderStatus: order.status,
          buyerId: order.buyerId,
          reviewerId: review.reviewerId,
          sellerId: order.sellerId,
          rating: review.rating,
          body: review.body,
          alreadyReviewed: false,
        }).ok,
        true,
      );
    }

    const open = openReviews({
      orders: store.orders,
      reviews: store.reviews,
      listings: store.listings,
      buyerId: "usr_jordan",
    });
    assert.deepEqual(
      open.map((item) => item.orderId),
      ["ord_hist_beanie"],
    );
    assert.equal(open[0]?.sellerId, "usr_maya");
  });
});

function order(id: string, status: "completed" | "pending" | "cancelled", buyerId: string) {
  return {
    id: `ord_${id}`,
    listingId: `lst_${id}`,
    buyerId,
    sellerId: "usr_maya",
    priceCents: 1200,
    status,
    createdAt: "2026-11-02T18:40:00.000Z",
  };
}

function listing(id: string) {
  return {
    id: `lst_${id}`,
    sellerId: "usr_maya",
    title: `Listing ${id}`,
    description: "A completed campus sale.",
    priceCents: 1200,
    category: "clothing" as const,
    ticketType: null,
    photos: [],
    condition: "good" as const,
    listingType: "fixed" as const,
    status: "sold" as const,
    seniorMoveOut: false,
    auctionEndsAt: null,
    createdAt: "2026-11-01T15:00:00.000Z",
  };
}

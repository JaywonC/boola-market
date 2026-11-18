import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSeed } from "../../lib/db/seed.ts";
import { settleExpiredAuctions } from "./settle.ts";

describe("settleExpiredAuctions", () => {
  it("marks the high bidder as winner and opens their order", () => {
    const store = buildSeed();
    const listing = store.listings.find((item) => item.id === "lst_game_pair");
    assert.ok(listing);
    listing.auctionEndsAt = "2026-11-17T12:00:00.000Z";
    const changed = settleExpiredAuctions(store, Date.parse("2026-11-17T13:00:00.000Z"));
    assert.equal(changed, true);
    assert.equal(listing.status, "sold");
    assert.equal(listing.auctionWinnerId, "usr_sam");
    const order = store.orders.find((item) => item.id === "ord_win_lst_game_pair");
    assert.ok(order);
    assert.equal(order.buyerId, "usr_sam");
    assert.equal(order.priceCents, 17000);
    assert.equal(settleExpiredAuctions(store, Date.parse("2026-11-17T14:00:00.000Z")), false);
  });
});

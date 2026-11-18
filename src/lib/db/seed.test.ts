import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEMO_ACCOUNTS } from "../../features/auth/demo-accounts.ts";
import { buildSeed } from "./seed.ts";

describe("seed", () => {
  it("includes the demo accounts and the headline ticket listings", () => {
    const store = buildSeed();
    const emails = new Set(store.users.map((user) => user.email));
    for (const account of DEMO_ACCOUNTS) {
      assert.equal(emails.has(account.email), true);
    }
    const active = store.listings.filter((listing) => listing.status === "active");
    assert.ok(active.some((listing) => listing.ticketType === "harvard_yale" && listing.event === "harvard-yale"));
    assert.ok(active.some((listing) => listing.ticketType === "yso"));
    assert.ok(active.some((listing) => listing.seniorMoveOut));
    assert.ok(store.bids.length >= 2);
    assert.ok(store.reviews.length >= 3);
    assert.ok(store.orders.some((order) => order.status === "completed"));
    assert.ok(store.messages.length >= 2);
    const game = store.listings.find((listing) => listing.id === "lst_game_pair");
    assert.ok(game?.auctionEndsAt);
    const hours = (Date.parse(game.auctionEndsAt ?? "") - Date.now()) / 36e5;
    assert.ok(hours > 3 && hours < 5);
    assert.ok(store.couriers.length >= 2);
    assert.ok(store.deliveries.some((delivery) => delivery.status === "open"));
  });
});

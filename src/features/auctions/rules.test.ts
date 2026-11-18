import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateBid } from "./rules.ts";

const base = {
  status: "active" as const,
  listingType: "auction" as const,
  sellerId: "usr_jordan",
  bidderId: "usr_sam",
  startPriceCents: 12000,
  auctionEndsAt: "2026-11-20T23:00:00.000Z",
  highestBidCents: 17000,
  amountCents: 18000,
  nowMs: Date.parse("2026-11-17T12:00:00.000Z"),
};

describe("evaluateBid", () => {
  it("accepts a bid above the current high bid", () => {
    assert.deepEqual(evaluateBid(base), { ok: true });
  });

  it("rejects a bid that does not beat the high bid", () => {
    const decision = evaluateBid({ ...base, amountCents: 17000 });
    assert.equal(decision.ok, false);
  });

  it("requires a five dollar raise", () => {
    const low = evaluateBid({ ...base, amountCents: 17400 });
    assert.equal(low.ok, false);
    if (!low.ok) assert.match(low.reason, /minimum raise is \$5/);
    assert.deepEqual(evaluateBid({ ...base, amountCents: 17500 }), { ok: true });
  });

  it("requires the starting price when nobody has bid", () => {
    const decision = evaluateBid({ ...base, highestBidCents: null, amountCents: 10000 });
    assert.equal(decision.ok, false);
  });

  it("blocks the seller and closed auctions", () => {
    assert.equal(evaluateBid({ ...base, bidderId: base.sellerId }).ok, false);
    assert.equal(evaluateBid({ ...base, nowMs: Date.parse("2026-11-21T00:00:00.000Z") }).ok, false);
    assert.equal(evaluateBid({ ...base, listingType: "fixed" }).ok, false);
  });
});

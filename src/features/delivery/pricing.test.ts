import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { quoteDelivery, recommendCourier } from "./pricing.ts";

describe("quoteDelivery", () => {
  it("charges three to five dollars based on the walk between colleges", () => {
    const nearby = quoteDelivery("Saybrook", "Branford");
    const across = quoteDelivery("Saybrook", "Morse");
    assert.equal(nearby.feeCents, 300);
    assert.equal(across.feeCents, 500);
    assert.ok(nearby.etaMinutes >= 20 && nearby.etaMinutes <= across.etaMinutes);
    assert.ok(across.etaMinutes <= 50);
  });

  it("picks a courier who is not the buyer or seller", () => {
    const chosen = recommendCourier(
      [
        { userId: "seller", college: "Grace Hopper" as const, rating: 5, active: true },
        { userId: "far", college: "Ezra Stiles" as const, rating: 5, active: true },
        { userId: "near", college: "Branford" as const, rating: 4.2, active: true },
      ],
      "Saybrook",
      ["seller"],
    );
    assert.equal(chosen?.userId, "near");
  });
});

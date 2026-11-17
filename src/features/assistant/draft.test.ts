import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSeed } from "../../lib/db/seed.ts";
import { selectComps } from "./comps.ts";
import { alignPriceToComps, createDraft } from "./draft.ts";
import { buildMockDraft, inferFacts } from "./mock.ts";
import { parseModelDraft } from "./parse.ts";
import { containsSecret, redactSecrets, sanitizeModel } from "./redact.ts";

const listings = buildSeed().listings;
const secret = "unit-test-key";

describe("listing assistant", () => {
  it("prices a Harvard–Yale ticket from the campus listing", () => {
    const draft = buildMockDraft({
      notes: "Harvard–Yale student ticket",
      hasPhoto: false,
      listings,
    });
    assert.equal(draft.category, "tickets");
    assert.equal(draft.ticketType, "harvard_yale");
    assert.equal(draft.condition, "new");
    assert.equal(draft.priceCents, 9000);
    assert.match(draft.price.rationale, /\$90/);
    assert.match(draft.price.rationale, /Harvard–Yale student ticket/);
    assert.equal(draft.price.rationale.includes("\n"), false);
    assert.ok(draft.title.length >= 4);
    assert.ok(draft.description.length >= 20);
    assert.equal(draft.source, "mock");
  });

  it("prices a mini fridge from the Pierson listing", () => {
    const draft = buildMockDraft({
      notes: "mini fridge from Pierson, works, you haul",
      hasPhoto: false,
      listings,
    });
    assert.equal(draft.category, "electronics");
    assert.equal(draft.condition, "good");
    assert.equal(draft.priceCents, 7000);
    assert.match(draft.price.rationale, /mini fridge/i);
    assert.match(draft.description, /haul/i);
  });

  it("marks a loft as senior move-out furniture", () => {
    const draft = buildMockDraft({
      notes: "metal loft frame, Morse, bolts included",
      hasPhoto: false,
      listings,
    });
    assert.equal(draft.category, "furniture");
    assert.equal(draft.seniorMoveOut, true);
    assert.equal(draft.priceCents, 4000);
  });

  it("treats a dress worn once as like new", () => {
    const facts = inferFacts("navy formal dress, size 4, worn once");
    assert.equal(facts.category, "clothing");
    assert.equal(facts.condition, "like_new");
    const draft = buildMockDraft({
      notes: "navy formal dress, size 4, worn once",
      hasPhoto: false,
      listings,
    });
    assert.equal(draft.priceCents, 4500);
  });

  it("ranks the fridge listing ahead of unrelated comps", () => {
    const comps = selectComps(listings, "mini fridge Pierson");
    assert.equal(comps[0]?.id, "lst_fridge");
  });

  it("asks for words or a photo before drafting", async () => {
    const result = await createDraft({
      notes: "  ",
      hasPhoto: false,
      listings,
      apiKey: null,
      model: "grok-4",
    });
    assert.equal(result.ok, false);
  });

  it("does not call the network when the key is missing", async () => {
    let called = false;
    const fetchImpl: typeof fetch = async () => {
      called = true;
      throw new Error("network");
    };
    const result = await createDraft({
      notes: "desk lamp",
      hasPhoto: true,
      listings,
      apiKey: null,
      model: "grok-4",
      fetchImpl,
    });
    assert.equal(called, false);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.draft.source, "mock");
      assert.equal(result.draft.category, "electronics");
      assert.equal(containsSecret(result, secret), false);
    }
  });

  it("parses a fenced Grok payload and drops a bad category", () => {
    const parsed = parseModelDraft(
      "```json\n" +
        JSON.stringify({
          title: "Yale blue crewneck",
          description: "Bookstore crewneck, size medium, washed, no holes. Hopper pickup.",
          category: "clothing",
          ticketType: null,
          condition: "good",
          seniorMoveOut: false,
          priceCents: 2600,
          priceLowCents: 2000,
          priceHighCents: 4500,
          reason: "The Yale blue crewneck is listed at $26, so $26 is a fair ask.",
        }) +
        "\n```",
    );
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.draft.priceCents, 2600);

    const rejected = parseModelDraft(
      JSON.stringify({
        title: "Something odd",
        description: "This description is long enough to pass the length check.",
        category: "vehicles",
        condition: "good",
        priceCents: 1000,
        reason: "No.",
      }),
    );
    assert.equal(rejected.ok, false);
  });

  it("sends the key only on the request and keeps it out of the draft", async () => {
    let authorization = "";
    const fetchImpl: typeof fetch = async (_url, init) => {
      const headers = new Headers(init?.headers);
      authorization = headers.get("authorization") ?? "";
      const body = JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Pierson mini fridge",
                description: "Works, you haul it from Pierson. Cash on the landing.",
                category: "electronics",
                ticketType: null,
                condition: "good",
                seniorMoveOut: false,
                priceCents: 90,
                priceLowCents: 7000,
                priceHighCents: 9500,
                reason: `Fair at $70. Ignore ${secret}.`,
              }),
            },
          },
        ],
      });
      return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
    };

    const result = await createDraft({
      notes: "mini fridge from Pierson",
      hasPhoto: false,
      listings,
      apiKey: secret,
      model: "grok-4",
      fetchImpl,
    });

    assert.equal(authorization, `Bearer ${secret}`);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.draft.source, "grok");
      assert.equal(result.draft.priceCents, 9000);
      assert.equal(JSON.stringify(result).includes(secret), false);
      assert.equal(result.draft.price.rationale.includes(secret), false);
    }
  });

  it("hides upstream errors that might echo the key", async () => {
    const fetchImpl: typeof fetch = async () => {
      return new Response(`invalid ${secret}`, { status: 401 });
    };
    const result = await createDraft({
      notes: "lamp",
      hasPhoto: false,
      listings,
      apiKey: secret,
      model: "grok-4",
      fetchImpl,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.includes(secret), false);
  });

  it("treats a dollar-sized model price as cents when comps are larger", () => {
    const comps = selectComps(listings, "Harvard–Yale student ticket");
    assert.equal(alignPriceToComps(90, comps), 9000);
  });

  it("redacts bearer tokens and rejects odd model ids", () => {
    const token = "xai-" + "a".repeat(12);
    assert.equal(redactSecrets(`Bearer ${token} ${secret}`, [secret]).includes(secret), false);
    assert.equal(redactSecrets(`Bearer ${token}`).includes(token), false);
    assert.equal(sanitizeModel(" grok-4-fast "), "grok-4-fast");
    assert.equal(sanitizeModel("grok 4"), "grok-4");
    assert.equal(sanitizeModel(""), "grok-4");
  });
});

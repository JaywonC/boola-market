import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isYaleEmail } from "./yale-email.ts";

describe("isYaleEmail", () => {
  it("accepts a normal yale.edu address", () => {
    assert.equal(isYaleEmail("maya.chen@yale.edu"), true);
    assert.equal(isYaleEmail("  Maya.Chen@Yale.edu "), true);
  });

  it("rejects other domains, subdomains, and empty locals", () => {
    assert.equal(isYaleEmail("maya@gmail.com"), false);
    assert.equal(isYaleEmail("maya@med.yale.edu"), false);
    assert.equal(isYaleEmail("maya@yale.edu.attacker.com"), false);
    assert.equal(isYaleEmail("maya@yale.edutest"), false);
    assert.equal(isYaleEmail("@yale.edu"), false);
    assert.equal(isYaleEmail("maya chen@yale.edu"), false);
    assert.equal(isYaleEmail("maya..chen@yale.edu"), false);
  });
});

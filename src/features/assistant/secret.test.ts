import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const skip = new Set(["node_modules", ".next", ".git", "coverage", "uploads"]);
const keyRead = "process.env." + "XAI_API_KEY";
const publicPrefix = "NEXT_PUBLIC_" + "XAI";
const liveKey = /xai-[A-Za-z0-9_-]{16,}/;

function files(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) {
      found.push(...files(full));
      continue;
    }
    if (info.size > 1_000_000) continue;
    found.push(full);
  }
  return found;
}

describe("XAI_API_KEY stays on the server", () => {
  it("ignores local env files and keeps the example empty", () => {
    const ignore = readFileSync(path.join(root, ".gitignore"), "utf8");
    for (const line of [".env", ".env.local", ".env*.local"]) {
      assert.ok(ignore.split("\n").includes(line), line);
    }
    const example = readFileSync(path.join(root, ".env.example"), "utf8");
    assert.match(example, /^XAI_API_KEY=\s*$/m);
    assert.equal(example.includes(publicPrefix), false);
  });

  it("reads the key in one server-only module and nowhere else", () => {
    const readers: string[] = [];
    const publicHits: string[] = [];
    const leaked: string[] = [];
    for (const file of files(root)) {
      if (/\.(png|jpg|jpeg|gif|webp|ico)$/i.test(file)) continue;
      const text = readFileSync(file, "utf8");
      const relative = path.relative(root, file);
      if (text.includes(keyRead)) readers.push(relative);
      if (text.includes(publicPrefix)) publicHits.push(relative);
      if (liveKey.test(text)) leaked.push(relative);
    }
    assert.deepEqual(readers, ["src/features/assistant/env.server.ts"]);
    assert.deepEqual(publicHits, []);
    assert.deepEqual(leaked, []);
    const server = readFileSync(path.join(root, "src/features/assistant/env.server.ts"), "utf8");
    assert.match(server, /import ["']server-only["']/);
    const slot = readFileSync(
      path.join(root, "src/features/assistant/components/listing-assistant-slot.tsx"),
      "utf8",
    );
    assert.equal(slot.includes("env.server"), false);
    assert.equal(slot.includes(keyRead), false);
  });
});

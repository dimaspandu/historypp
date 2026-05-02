import assert from "node:assert/strict";
import { createEngine } from "./engine.mjs";

function test(name, fn) {
  try {
    fn();
    console.log("✓", name);
  } catch (e) {
    console.log("✗", name, e.message);
    process.exit(1);
  }
}

// ==============================
// TESTS
// ==============================

test("Simple matcher works", () => {
  const r = createEngine();

  r.router("/user/:id");

  const m = r.matchRoute("/user/10");

  assert.equal(m.params.id, "10");
});

test("Trie matcher works", () => {
  const r = createEngine();
  r.config({ matcher: "trie" });

  r.router("/user/:id");

  const m = r.matchRoute("/user/20");

  assert.equal(m.params.id, "20");
});

test("Cache works (same reference)", () => {
  const r = createEngine();

  r.router("/p/:id");

  const m1 = r.matchRoute("/p/1");
  const m2 = r.matchRoute("/p/1");

  assert.strictEqual(m1, m2); // same cached object
});

test("Navigation context", () => {
  const r = createEngine();

  r.router("/a");

  const ctx = r.navigate("/a");

  assert.equal(ctx.path, "/a");
});
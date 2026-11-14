import assert from "node:assert/strict";
import { createEngine } from "../src/1.0.7/index.js";
import { run } from "../src/1.0.7/navigation/run.js";

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

test("isSelfNavigate is false on initial load and true on navigatePush to same static route", () => {
  const r = createEngine();
  const captured = [];

  r.router("/about", {
    onMeet(ctx) {
      captured.push(ctx);
    }
  });

  r.navigatePush("/about");
  assert.equal(captured[0].firstArrive, true);
  assert.equal(captured[0].isSameRoute, false);
  assert.equal(captured[0].isSelfNavigate, false);
  assert.equal(captured[0].isSameURL, false);

  r.navigatePush("/about");
  assert.equal(captured[1].firstArrive, false);
  assert.equal(captured[1].isSameRoute, true);
  assert.equal(captured[1].isSelfNavigate, true);
  assert.equal(captured[1].isSameURL, true);
  assert.equal(captured[1].from, "/about");
  assert.equal(captured[1].to, "/about");
});

test("isSelfNavigate and isSameRoute are true when navigating from /search to /search?q=something", () => {
  const r = createEngine();
  const captured = [];

  r.router("/search", {
    onMeet(ctx) {
      captured.push(ctx);
    }
  });

  r.navigateReplace("/search");
  r.navigateReplace("/search?q=keyboard");

  assert.equal(captured.length, 2);
  assert.equal(captured[1].isSameRoute, true);
  assert.equal(captured[1].isSelfNavigate, true);
  assert.equal(captured[1].isSameURL, false);
  assert.equal(captured[1].from, "/search");
  assert.equal(captured[1].to, "/search");
  assert.deepEqual(captured[1].query, { q: "keyboard" });
});

test("isSameURL is true only when both pathname and query string match", () => {
  const r = createEngine();
  const captured = [];

  r.router("/search", {
    onMeet(ctx) {
      captured.push(ctx);
    }
  });

  r.navigateReplace("/search?q=hp");
  r.navigateReplace("/search?q=hp");

  assert.equal(captured[1].isSameRoute, true);
  assert.equal(captured[1].isSelfNavigate, true);
  assert.equal(captured[1].isSameURL, true);
});

test("isSelfNavigate is true on push/replace to identical dynamic param route", () => {
  const r = createEngine();
  const captured = [];

  r.router("/user/:id", {
    onMeet(ctx) {
      captured.push(ctx);
    }
  });

  r.navigate("/user/5");
  r.navigateReplace("/user/5");
  r.navigatePush("/user/5");

  assert.equal(captured.length, 3);
  assert.equal(captured[1].isSelfNavigate, true);
  assert.equal(captured[1].isSameRoute, true);
  assert.equal(captured[1].isSameURL, true);

  assert.equal(captured[2].isSelfNavigate, true);
  assert.equal(captured[2].isSameRoute, true);
  assert.equal(captured[2].isSameURL, true);
});

test("isSameRoute is true when navigating to a different param value on the same route", () => {
  const r = createEngine();
  const captured = [];

  r.router("/user/:id", {
    onMeet(ctx) {
      captured.push(ctx);
    }
  });

  r.navigate("/user/5");
  r.navigate("/user/42");

  assert.equal(captured.length, 2);
  assert.equal(captured[1].isSameRoute, true);
  assert.equal(captured[1].isSelfNavigate, true);
  assert.equal(captured[1].isSameURL, false);
  assert.equal(captured[1].from, "/user/5");
  assert.equal(captured[1].to, "/user/42");
  assert.equal(captured[1].params.id, "42");
});

test("isSelfNavigate and isSameRoute are false when navigating to a different route", () => {
  const r = createEngine();
  const captured = [];

  r.router("/about", {
    onMeet(ctx) {
      captured.push({ hook: "about", ctx });
    }
  });

  r.router("/contact", {
    onMeet(ctx) {
      captured.push({ hook: "contact", ctx });
    }
  });

  r.navigate("/about");
  r.navigate("/contact");

  assert.equal(captured.length, 2);
  assert.equal(captured[1].hook, "contact");
  assert.equal(captured[1].ctx.isSelfNavigate, false);
  assert.equal(captured[1].ctx.isSameRoute, false);
  assert.equal(captured[1].ctx.isSameURL, false);
});

test("isSelfNavigate is false for pop navigation while isSameRoute is true", () => {
  const r = createEngine();
  const captured = [];

  r.router("/search", {
    onMeet(ctx) {
      captured.push(ctx);
    }
  });

  r.navigateReplace("/search");
  r.navigateReplace("/search?q=hp");

  // Simulate pop back to "/search" while active route is still "/search"
  run(r._state, "/search", "pop");

  assert.equal(captured.length, 3);
  assert.equal(captured[2].type, "pop");
  assert.equal(captured[2].isSameRoute, true);
  assert.equal(captured[2].isSelfNavigate, false);
  assert.equal(captured[2].isSameURL, false);
  assert.equal(captured[2].from, "/search");
  assert.equal(captured[2].to, "/search");
});

test("works with trie matcher and exposes flags across middleware and guards", () => {
  const r = createEngine();
  r.config({ matcher: "trie" });

  const mwContexts = [];
  const guardContexts = [];

  r.use((ctx, next) => {
    mwContexts.push({
      path: ctx.path,
      isSameRoute: ctx.isSameRoute,
      isSelfNavigate: ctx.isSelfNavigate
    });
    next();
  });

  r.router("/dashboard", {
    canLeave(ctx) {
      guardContexts.push({
        isSameRoute: ctx.isSameRoute,
        isSelfNavigate: ctx.isSelfNavigate
      });
      return true;
    },
    onMeet() {}
  });

  r.navigate("/dashboard");
  r.navigatePush("/dashboard");

  assert.equal(mwContexts[0].isSelfNavigate, false);
  assert.equal(mwContexts[1].isSelfNavigate, true);
  assert.equal(mwContexts[1].isSameRoute, true);

  r.navigatePush("/settings");
  assert.equal(guardContexts[0].isSelfNavigate, true);
  assert.equal(guardContexts[0].isSameRoute, true);
});
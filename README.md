# History++ (SPA Navigation Engine)

A lightweight, UI-agnostic navigation engine built on top of the native History API.

It extends `window.history` with structured routing, direction-aware lifecycle hooks, and navigation orchestration without external dependencies.

---

## Overview

This router keeps browser-native navigation behavior intact while adding a predictable route lifecycle:

* No page reloads
* Native back/forward support
* URL-driven state
* History stack integrity
* Route lifecycle that changes based on navigation direction

The router acts as an orchestration layer and does not handle rendering for you.

---

## Getting Started

### Run Local Server

This project includes a minimal Node.js server for running the examples:

```bash
node server.js
```

Then open:

```text
http://localhost:5173
```

The server opens the examples index by default.

---

### Smart Example Routing

The built-in server resolves nested example routes automatically by finding the nearest matching `index.html`.

Examples:

```text
/examples/01-basic-routing/about
/examples/02-dynamic-params/user/1
/examples/03-lifecycle-visualizer/contact
```

This makes the lifecycle and dynamic-param demos work in `history` mode without extra server setup.

---

### Why a Server Is Required

When using `history` mode, the browser relies on `pushState`, `replaceState`, and direct URL access.

Opening files directly with:

```text
file://...
```

will break route resolution.

---

### Alternative (No Server)

If you cannot run a server, switch to hash mode:

```js
history.config({ mode: "hash" });
```

---

## Examples

Open the examples index:

```text
http://localhost:5173/examples/
```

Available demos:

* `/examples/01-basic-routing` - basic route registration and route switching
* `/examples/02-dynamic-params` - dynamic path segments such as `/user/:id`
* `/examples/03-lifecycle-visualizer` - visualizes the full lifecycle flow for push, replace, and pop
* `/examples/04-guards-blocking` - demonstrates `canLeave` and blocked navigation flows
* `/examples/05-hash-vs-history` - compares hash mode vs history mode routing
* `/examples/06-end-route` - demonstrates terminal routes in mobile-like push navigation
* `/examples/07-modal-route` - demonstrates modal-based route navigation
* `/examples/08-bottom-sheet` - route-driven bottom-sheet interaction

---

## Routing Modes

### History Mode (default)

```text
/about
```

Uses the native History API and works best when the server can resolve nested routes.

### Hash Mode

```text
/#/about
```

Uses `location.hash` and works without server-side route handling.

### Configuration

```js
history.config({
  mode: "history", // or "hash"
  base: "/examples/01-basic-routing"
});
```

---

## Core API

```js
history.config(options)
history.router(path, handler?)
history.navigatePush(path, state?)
history.navigateReplace(path, state?)
history.navigatePop()
```

---

## Basic Usage

```js
history.config({
  base: "/examples/01-basic-routing",
  mode: "history"
});

history.router("/", {
  onMeet() {
    console.log("Home");
  }
});

history.router("/about", {
  onMeet() {
    console.log("About");
  }
});

history.navigateReplace(location.pathname + location.search);
```

The last line is important for syncing the current URL into the router on first load.

---

## Lifecycle Model

The router is lifecycle-driven and direction-aware.

### Push / Replace

```text
current -> onExit
next    -> onArrive -> onMeet
```

### Pop (Back / Forward)

```text
current -> onReturn -> onExit
next    -> onComeback -> onMeet
```

This means the route being left and the route being entered can react differently depending on whether navigation was initiated programmatically or via browser history.

---

## Lifecycle Hooks

| Hook       | When it runs |
| ---------- | ------------ |
| `onMeet` | Every time the route becomes active |
| `onArrive` | When entering through `navigatePush()` or `navigateReplace()` |
| `onExit` | Right before leaving the current route |
| `onReturn` | Right before leaving the current route because of back/forward navigation |
| `onComeback` | When a route becomes active again through back/forward navigation |

All hooks are optional.

### Example

```js
history.router("/profile/:id", {
  onArrive(ctx) {
    console.log("Fresh arrival", ctx.params.id);
  },
  onMeet(ctx) {
    console.log("Always active", ctx.path);
  },
  onExit(ctx) {
    console.log("Leaving", ctx.from, "->", ctx.to);
  },
  onReturn(ctx) {
    console.log("Leaving because of pop", ctx.path);
  },
  onComeback(ctx) {
    console.log("Returned via browser history", ctx.path);
  }
});
```

---

## Context Object (`ctx`)

Each lifecycle hook receives:

```js
{
  path,   // normalized matched path, without base
  params, // dynamic params
  query,  // parsed query string object
  state,
  from,   // previous route path
  to,     // target route path
  type    // "push" | "replace" | "pop"
}
```

Useful details:

* `ctx.params` is filled when the route contains dynamic segments
* `ctx.query` is parsed from the URL search string
* `ctx.type` tells you whether the transition came from push, replace, or pop

---

## Dynamic Params

```js
history.router("/user/:id", {
  onMeet(ctx) {
    console.log(ctx.params.id);
  }
});
```

Example:

```js
history.navigatePush("/user/42");
// ctx.params.id === "42"
```

Static routes are matched before dynamic ones with the same shape.

---

## End Route

Routes can be marked as terminal by setting `end: true`.

```js
history.router("/", {
  end: true,
  onMeet() {
    console.log("Home");
  }
});
```

Behavior:

* Intended for flows where a route should behave like the root boundary of the current app state
* In `history` mode, if the active route is marked as `end` and the user navigates back, the router lets the browser continue going further back in history
* Useful for mobile-like tab navigation or embedded flows where the root screen should act as the exit point

See `/examples/06-end-route` for the current behavior in practice.

---

## Path Handling

The router resolves paths through a small internal path layer:

* Ensures every path starts with `/`
* Removes accidental leading `#`
* Applies `base` when building URLs
* Strips `base` before route matching
* Parses query strings into `ctx.query`
* Supports both `history` and `hash` modes consistently

Example with `base: "/examples/02-dynamic-params"`:

```text
Browser URL: /examples/02-dynamic-params/user/7?tab=info
Matched path: /user/7
ctx.query: { tab: "info" }
```

---

## Guards (`canLeave`)

```js
history.router("/form", {
  canLeave(ctx) {
    return confirm("Leave this page?");
  }
});
```

Behavior:

* Evaluated on the current active route
* Applies to `push`, `replace`, and `pop`
* If a `pop` navigation is blocked, the router restores the current URL automatically

---

## Execution Flow

The diagrams in `docs/diagrams/` describe the high-level navigation flow for push/replace and back navigation.

---

## Production Notes

### Link Interception

```js
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-link]");
  if (!a) return;

  const url = new URL(a.href);
  if (url.origin !== location.origin) return;

  e.preventDefault();
  history.navigatePush(url.pathname + url.search);
});
```

### Server Strategy

Single-entry SPA:

```text
/about -> index.html
```

Multi-entry or SSR:

```text
/       -> index.html
/about  -> about.html
```

---

## Design Principles

1. Router is an orchestration layer
2. URL is the source of truth
3. Routes describe UI state, not transitions
4. Lifecycle drives behavior
5. Native browser behavior is preserved

---

## License

MIT

# History Router (SPA Navigation Engine)

A lightweight, UI-agnostic navigation engine built on top of the native History API. This design extends the `window.history` object to provide structured routing, lifecycle control, and navigation orchestration without introducing external dependencies.

---

## Overview

This system enhances the native browser navigation model while preserving its behavior:

* No page reloads
* Native back/forward support
* URL-driven state
* History stack integrity

The router acts purely as an orchestration layer and does not handle rendering.

---

## Routing Mode

This system supports two routing modes:

### History Mode (default)

```text
/about
```

Uses the native History API (`pushState`, `replaceState`, `popstate`).

Requirements:

* Server must be configured to always return the entry HTML file (e.g. `index.html`)
* Direct access or reload on nested routes must be handled by the server

---

### Hash Mode

```text
/#/about
```

Uses the URL hash (`location.hash`, `hashchange`) and does not require server configuration.

Works in:

* static hosting
* local files (`file://`)
* environments without server fallback

---

### Configuration

```js
history.config({
  mode: "history" // or "hash"
});
```

---

### Behavior

| Method                    | History Mode    | Hash Mode         |
| ------------------------- | --------------- | ----------------- |
| navigatePush("/about")    | /about          | /#/about          |
| navigateReplace("/about") | /about          | /#/about          |
| navigatePop()             | uses `popstate` | uses `hashchange` |

In hash mode, the router automatically prefixes paths with `#`.

---

### Path Resolution

The router internally normalizes paths:

* History mode → `location.pathname`
* Hash mode → `location.hash.slice(1)`

---

### Recommendation

* Use history mode when server configuration is available
* Use hash mode for static or file-based environments

---

## Core API

```js
history.router(path, handler?)
history.navigatePush(path, state?)
history.navigateReplace(path, state?)
history.navigatePop()

history.use(middleware)
history.block(blocker)
history.notFound(handler)
```

---

## Navigation Methods

All navigation methods are built on top of the native History API and do not trigger page reloads.

### navigatePush

```js
history.navigatePush("/about", { from: "home" });
```

* Uses `pushState`
* Adds a new history entry
* Updates URL
* Triggers router execution

---

### navigateReplace

```js
history.navigateReplace("/login");
```

* Uses `replaceState`
* Replaces current history entry
* Updates URL
* Triggers router execution

---

### navigatePop

```js
history.navigatePop();
```

* Uses `history.back()`
* Relies on `popstate` event
* Router execution is triggered by the event

---

## Route Definition

### Function Style

```js
history.router("/about", (ctx) => {
  console.log("About page");
});
```

A function handler is internally mapped to:

```js
{ onMeet: handler }
```

---

### Object Style

```js
history.router("/user/:id", {
  onMeet(ctx) {},
  onArrive(ctx) {},
  onExit(ctx) {},
  onComeback(ctx) {},
  canLeave(ctx) { return true; },
  end: true
});
```

---

### Chaining Style

```js
history
  .router("/user/:id")
  .onMeet(ctx => {})
  .onExit(ctx => {})
  .canLeave(ctx => true)
  .end(true)
  .done();
```

All styles are normalized into a lifecycle object internally.

---

## Lifecycle Hooks

| Hook       | Description                             |
| ---------- | --------------------------------------- |
| onMeet     | Runs every time route becomes active    |
| onArrive   | Runs only on first entry                |
| onExit     | Runs before leaving the route           |
| onComeback | Runs when returning via back navigation |

All hooks default to no-op if not defined.

---

## Context Object (ctx)

```js
{
  path,
  params,
  query,
  state,
  from,
  to,
  type
}
```

### Dynamic Parameters

```js
history.router("/article/:id", (ctx) => {
  console.log(ctx.params.id);
});

history.navigatePush("/article/9");
```

Result:

```js
ctx.params = { id: "9" };
```

Notes:

* Parameters are strings
* Static routes take priority over dynamic

---

## Middleware

```js
history.use(async (ctx, next) => {
  await next();
});
```

Execution order:

1. Middleware (before)
2. Lifecycle
3. Middleware (after)

---

## Guards and Blocking

### Understanding `canLeave`

`canLeave` is evaluated on the **current (active) route**, not the target route.

It answers the question:

```
Is the current route allowed to be exited?
```

This check is performed for every navigation attempt:

* navigatePush
* navigateReplace
* browser back/forward (popstate)

Flow perspective:

```
[current route] --(canLeave?)--> [next route]
```

If `canLeave` returns `false`, navigation is cancelled before any lifecycle of the next route runs.

Relation to lifecycle:

* `canLeave` → decision (guard)
* `onExit` → side effect (executed after allowed)

---

### Global Blocker

```js
history.block(() => false);
```

### Route-level Guard

```js
history.router("/form", {
  canLeave() {
    return false;
  }
});
```

---

## End Route

```js
history.router("/success", {
  end: true
});
```

Defines a terminal route in navigation flow.

---

## Execution Flow

### Programmatic Navigation (Activity Diagram)

![Push Replace Activity](docs/diagrams/push_replace-navigation-activity-diagram.png)

---

### Programmatic Navigation (Sequence Diagram)

![Push Replace Sequence](docs/diagrams/push_navigation-sequence-diagram.png)

---

### Back Navigation (Activity Diagram)

![Back Activity](docs/diagrams/back-navigation-activity-diagram.png)

---

### Back Navigation (Sequence Diagram)

![Back Sequence](docs/diagrams/back-navigation-sequence-diagram.png)

---

## Production Considerations

### Link Interception

```js
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;

  const url = new URL(a.href);
  if (url.origin === location.origin) {
    e.preventDefault();
    history.navigatePush(url.pathname);
  }
});
```

---

### Server Handling

Server behavior depends on the application architecture:

#### Single-entry (SPA)

All routes should resolve to a single HTML entry file (e.g. `index.html`):

```text
/about → index.html
```

This approach requires server-side fallback configuration so that direct access or reload on nested routes works correctly.

---

#### Multi-entry / SSR

Each route may return its own HTML document:

```text
/       → index.html
/about  → about.html
```

In this model, the router acts as a client-side orchestration and enhancement layer on top of server-rendered content.

---

### State Handling

If `state` is not provided:

```js
history.state === null
```

It is recommended to normalize to an empty object in the router.

---

## Design Principles

1. Router acts as orchestration layer
2. No dependency on UI or rendering
3. Lifecycle-driven navigation
4. Native browser behavior is preserved
5. Extends History API semantics rather than replacing them

---

## License

MIT

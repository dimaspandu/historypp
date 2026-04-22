# History++ (History Router)

A lightweight, UI-agnostic navigation engine built on top of the native History API.

It extends `window.history` with structured routing, lifecycle control, and navigation orchestration — without external dependencies.

---

## Overview

This system enhances the native browser navigation model while preserving its behavior:

* No page reloads
* Native back/forward support
* URL-driven state
* History stack integrity

The router acts purely as an orchestration layer and does not handle rendering.

---

## Getting Started

### Run Local Server

This project includes a simple Node.js static server for running examples.

```bash
node server.js
```

Then open in your browser:

```text
http://localhost:5173
```

---

### Why a Server is Required

When using **history mode**, the browser relies on the History API (`pushState`, `replaceState`).

Opening files directly using:

```text
file://...
```

will break routing behavior.

---

### Alternative (No Server)

If you cannot run a server, switch to hash mode:

```js
history.config({
  mode: "hash"
});
```

---

## Examples

Available examples:

* `/examples/01-basic-routing`
* `/examples/07-bottom-sheet`

More examples are included as scaffolding and will be expanded.

---

## Routing Modes

### History Mode (default)

```text
/about
```

Uses the native History API.

---

### Hash Mode

```text
/#/about
```

Uses `location.hash` and works without server configuration.

---

## Base Path

For apps running in subdirectories:

```js
history.config({
  base: "/examples/01-basic-routing"
});
```

---

## Core API

```js
history.router(path, handler?)
history.navigatePush(path, state?)
history.navigateReplace(path, state?)
history.navigatePop()
```

---

## Basic Usage

```js
history.router("/", () => {
  console.log("Home");
});

history.router("/about", () => {
  console.log("About");
});

history.navigatePush("/about");
```

---

## Lifecycle

| Hook   | Description                    |
| ------ | ------------------------------ |
| onMeet | Runs when route becomes active |
| onExit | Runs before leaving the route  |

---

## Design Principles

1. Router is an orchestration layer
2. No dependency on UI frameworks
3. URL is the source of truth
4. Routes describe UI state, not transitions
5. Native browser behavior is preserved

---

## License

MIT

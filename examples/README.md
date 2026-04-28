# Examples

This folder contains runnable demos for `History++`. Each example isolates one navigation scenario so the router behavior is easier to inspect, especially around route matching and lifecycle flow.

## Run the examples

Start the local server from the project root:

```bash
node server.js
```

Then open:

```text
http://localhost:5173/examples/
```

If you open the files directly with `file://`, demos that use `history` mode will not resolve routes correctly.

## What these demos cover

Implemented demos:

* `01-basic-routing` - the smallest setup for route registration, link interception, and initial URL sync
* `02-dynamic-params` - dynamic route matching with params such as `/user/:id`
* `03-lifecycle-visualizer` - full lifecycle visualization for `onArrive`, `onMeet`, `onReturn`, `onExit`, and `onComeback`
* `04-guards-blocking` - route guard behavior for unsaved changes and blocked navigation
* `06-end-route` - terminal route behavior for mobile-like push navigation and browser back handling
* `07-bottom-sheet` - route-driven UI state for a bottom-sheet interaction

Scaffolded folders:

* `05-hash-vs-history` - planned for comparing navigation modes
* `06-modal-route` - still available as a separate scaffold for modal route patterns
* `08-multi-step-flow` - planned for step-based flows
* `09-middleware` - planned for middleware orchestration

## Common pattern used in the demos

Most demos follow the same setup:

```js
history.config({
  base: "/examples/example-name",
  mode: "history"
});

history.router("/", {
  onMeet() {}
});

history.navigateReplace(location.pathname + location.search);
```

Why this matters:

* `base` lets each demo run from its own subdirectory
* `history` mode keeps the examples aligned with the main project behavior
* `navigateReplace(location.pathname + location.search)` performs the initial sync from the current browser URL into the router

## End route demo note

`06-end-route` demonstrates route definitions that use `end: true`.

It shows:

* push-based navigation between sibling screens
* a terminal route acting as the root boundary of the demo flow
* browser back behavior when the active route is marked as an end route

## Lifecycle demo note

`03-lifecycle-visualizer` is the best reference when you want to understand the current lifecycle model.

It shows:

* `push` and `replace` entering a route through `onArrive -> onMeet`
* `pop` leaving the current route through `onReturn -> onExit`
* `pop` re-activating the target route through `onComeback -> onMeet`

## Notes

The examples are intentionally framework-agnostic. They use plain HTML and direct DOM updates so the router behavior stays easy to observe.

For the full API and design overview, see the root [README](../README.md).

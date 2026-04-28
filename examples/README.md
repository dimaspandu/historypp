# Examples

This folder contains runnable demos for `History++`, each focused on a small navigation scenario so the router behavior is easier to inspect.

## Run the examples

Start the local static server from the project root:

```bash
node server.js
```

Then open:

```text
http://localhost:5173/examples/
```

If the HTML files are opened directly with `file://`, demos that rely on history mode will not behave correctly.

## Available demos

Implemented demos:

* `01-basic-routing` - basic route registration, active route switching, and push navigation
* `02-dynamic-params` - dynamic segments such as `/article/:id`
* `03-lifecycle-visualizer` - visualizes route lifecycle transitions
* `07-bottom-sheet` - bottom-sheet style navigation driven by routes

Scaffolded folders:

* `04-guards-blocking` - planned for navigation guard and blocking behavior
* `05-hash-vs-history` - planned for comparing router modes
* `06-modal-route` - planned for modal route patterns
* `08-multi-step-flow` - planned for multi-step flow navigation
* `09-middleware` - planned for middleware orchestration

## Notes

Each demo may configure a base path such as `/examples/01-basic-routing` so it can run from its own subdirectory without changing route definitions.

For the full API and design overview, see the root [README](../README.md).

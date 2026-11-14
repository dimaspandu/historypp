# Tests

This folder contains unit tests for the History++ router core functionality.

The tests are written for Node.js and can run without DOM or external dependencies.

## Running Tests

Run all tests:
```bash
npm run test
```

Run specific test:
```bash
node tests/route-matching.test.js
node tests/self-navigation.test.js
```

## Test Coverage

- Route matching and parameter extraction
- Path normalization and base path handling
- Middleware pipeline execution
- Navigation context and lifecycle hooks
- Global notFound handler
- Enhanced navigation guards and rollback handling
- Self-navigation and same-route detection (`ctx.isSelfNavigate`, `ctx.isSameRoute`, `ctx.isSameURL`)

## Test Framework

Uses Node.js built-in `assert` module for assertions. Test results are reported to console with pass/fail indicators.

The tests directly import the modular ESM implementation from `src/1.0.7/index.js` for isolated testing.
# Tests

This folder contains unit tests for the History++ router core functionality.

The tests are written for Node.js and can run without DOM or external dependencies.

## Running Tests

Run all tests:
```bash
node tests/index.js
```

Run individual test:
```bash
node tests/route-matching.test.js
```

## Test Coverage

- **route-matching.test.js**: Tests for path normalization, base path handling, route registration, and route matching with static and dynamic routes
- Other test files cover additional functionality like context, guards, middleware, navigation, and Trie operations

## Test Framework

Uses Node.js built-in `assert` module for assertions. Test results are reported to console with pass/fail indicators.
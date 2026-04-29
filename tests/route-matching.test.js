// ==============================
// Unit Tests for Router Core
// Run with: node tests/route-matching.test.js
// ==============================

import assert from 'node:assert/strict';
import RouterCore from '../src/router-core.mjs';

function runTests() {
  console.log('Running Router Core Tests...\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
    }
  }

  // Test Path Normalization
  test('Path normalization - adds leading slash', () => {
    const router = new RouterCore();
    assert.equal(router.normalizePath('home'), '/home');
    assert.equal(router.normalizePath('/home'), '/home');
  });

  test('Path normalization - removes trailing slash', () => {
    const router = new RouterCore();
    assert.equal(router.normalizePath('/home/'), '/home');
    assert.equal(router.normalizePath('/'), '/');
  });

  // Test Base Path Handling
  test('Base path stripping', () => {
    const router = new RouterCore();
    router.config({ base: '/examples/01-basic-routing' });
    assert.equal(router.stripBase('/examples/01-basic-routing/about'), '/about');
    assert.equal(router.stripBase('/examples/01-basic-routing'), '/');
  });

  test('Base path application', () => {
    const router = new RouterCore();
    router.config({ base: '/examples/01-basic-routing' });
    assert.equal(router.applyBase('/about'), '/examples/01-basic-routing/about');
    assert.equal(router.applyBase('/'), '/examples/01-basic-routing/');
  });

  // Test Route Registration
  test('Route registration - static route', () => {
    const router = new RouterCore();
    router.router('/home', { onMeet() {} });
    assert.equal(router.routes.length, 1);
    assert.equal(router.routes[0].path, '/home');
    assert.equal(router.routes[0].isDynamic, false);
  });

  test('Route registration - dynamic route', () => {
    const router = new RouterCore();
    router.router('/user/:id', { onMeet() {} });
    assert.equal(router.routes[0].isDynamic, true);
    assert.deepEqual(router.routes[0].segments, ['user', ':id']);
  });

  // Test Route Matching
  test('Route matching - static route', () => {
    const router = new RouterCore();
    router.router('/home', { onMeet() {} });
    const match = router.matchRoute('/home');
    assert(match !== null);
    assert.deepEqual(match.params, {});
  });

  test('Route matching - dynamic route', () => {
    const router = new RouterCore();
    router.router('/user/:id', { onMeet() {} });
    const match = router.matchRoute('/user/42');
    assert(match !== null);
    assert.equal(match.params.id, '42');
  });

  test('Route matching - no match', () => {
    const router = new RouterCore();
    router.router('/home', { onMeet() {} });
    const match = router.matchRoute('/about');
    assert.equal(match, null);
  });

  test('Route matching - multiple segments', () => {
    const router = new RouterCore();
    router.router('/blog/:year/:month', { onMeet() {} });
    const match = router.matchRoute('/blog/2023/04');
    assert(match !== null);
    assert.equal(match.params.year, '2023');
    assert.equal(match.params.month, '04');
  });

  test('Route matching - static takes precedence over dynamic', () => {
    const router = new RouterCore();
    router.router('/user/profile', { onMeet() {} });
    router.router('/user/:id', { onMeet() {} });
    const match = router.matchRoute('/user/profile');
    assert(match !== null);
    assert.equal(match.route.path, '/user/profile');
  });

  // Test Middleware
  test('Middleware execution', () => {
    const router = new RouterCore();
    let middlewareCalled = false;
    router.use((ctx, next) => {
      middlewareCalled = true;
      next();
    });
    router.router('/test', { onMeet() {} });

    // Simulate navigation
    router.navigate('/test');
    assert(middlewareCalled);
  });

  // Test Navigation Context
  test('Navigation context - push', () => {
    const router = new RouterCore();
    let ctxReceived;
    router.router('/test', {
      onMeet(ctx) {
        ctxReceived = ctx;
      }
    });

    router.navigate('/test', 'push');
    assert.equal(ctxReceived.path, '/test');
    assert.equal(ctxReceived.type, 'push');
    assert.equal(ctxReceived.from, null);
  });

  test('Navigation context - with base', () => {
    const router = new RouterCore();
    router.config({ base: '/app' });
    let ctxReceived;
    router.router('/page', {
      onMeet(ctx) {
        ctxReceived = ctx;
      }
    });

    router.navigate('/app/page');
    assert.equal(ctxReceived.path, '/page');
  });

  // Results
  console.log(`\n${passed}/${total} tests passed`);
  if (passed === total) {
    console.log('All tests passed! 🎉');
  } else {
    console.log('Some tests failed 😞');
    process.exit(1);
  }
}

runTests();
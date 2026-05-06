// ==============================
// History++ Core v1.0.5 (ESM)
// Based on v1.0.4
// ==============================
//

// ==============================
// INTERNAL STATE
// ==============================

let routes = [];
let middlewares = [];
let current = null;
let notFoundHandler = null;

let CONFIG = {
  base: "",
  mode: "history",
  matcher: "simple"
};

let routeCache = Object.create(null);
let trieRoot = {};

// ==============================
// PUBLIC API
// ==============================

function config(options = {}) {
  CONFIG.base = options.base || "";
  CONFIG.mode = options.mode || "history";
  CONFIG.matcher = options.matcher || "simple";
}

function use(fn) {
  middlewares.push(fn);
}

function notFound(handler) {
  if (typeof handler === "function") {
    notFoundHandler = handler;
  }

  return this;
}

// ==============================
// MIDDLEWARE EXECUTION
// ==============================

function runMiddlewares(ctx, finalHandler) {
  let index = -1;

  function dispatch(i) {
    if (i <= index) return;

    index = i;

    const mw = middlewares[i];

    if (!mw) {
      return finalHandler();
    }

    return mw(ctx, () => dispatch(i + 1));
  }

  return dispatch(0);
}

// ==============================
// PATH UTILITIES
// ==============================

function normalizePath(path) {
  if (!path) {
    return "/";
  }

  if (path.startsWith("#")) {
    path = path.slice(1);
  }

  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  return path;
}

function stripBase(path) {
  if (CONFIG.base && path.startsWith(CONFIG.base)) {
    const p = path.slice(CONFIG.base.length);
    return p || "/";
  }

  return path;
}

function addBase(path) {
  if (!CONFIG.base) {
    return path;
  }

  if (path.startsWith(CONFIG.base)) {
    return path;
  }

  return CONFIG.base + path;
}

function parseQuery(search = "") {
  const query = {};
  const params = new URLSearchParams(search);

  for (const [k, v] of params.entries()) {
    query[k] = v;
  }

  return query;
}

function buildURL(path) {
  path = normalizePath(path);

  if (CONFIG.mode === "hash") {
    return "/#" + path;
  }

  return addBase(path);
}

function getCurrentPath() {
  // For testing, not implemented
  return "/";
}

// ==============================
// MATCHING SYSTEM
// ==============================

function compileRoute(path, handler) {
  const isDynamic = path.includes(":");

  let keys = [];
  let regex = null;

  if (isDynamic) {
    const pattern = path.replace(/:([^/]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });

    regex = new RegExp("^" + pattern + "$");
  }

  return {
    path,
    isDynamic,
    keys,
    regex,
    ...handler
  };
}

function addToTrie(route) {
  const parts = route.path.split("/").filter(Boolean);

  let node = trieRoot;

  for (const part of parts) {
    const key = part.startsWith(":") ? ":" : part;

    node[key] = node[key] || {};
    node = node[key];

    if (key === ":") {
      node.paramKey = part.slice(1);
    }
  }

  node.route = route;
}

function matchTrie(path) {
  const parts = normalizePath(path).split("/").filter(Boolean);

  let node = trieRoot;
  const params = {};

  for (const part of parts) {
    if (node[part]) {
      node = node[part];
    } else if (node[":"]) {
      params[node[":"].paramKey] = part;
      node = node[":"];
    } else {
      return null;
    }
  }

  if (!node.route) {
    return null;
  }

  return {
    route: node.route,
    params
  };
}

function matchSimple(path) {
  path = normalizePath(path);

  if (routeCache[path]) {
    return routeCache[path];
  }

  for (const r of routes) {

    // Static route match

    if (!r.isDynamic && r.path === path) {
      return (routeCache[path] = {
        route: r,
        params: {}
      });
    }

    // Dynamic route match

    if (r.isDynamic) {
      const match = path.match(r.regex);

      if (match) {
        const params = {};

        r.keys.forEach((k, i) => {
          params[k] = match[i + 1];
        });

        return (routeCache[path] = {
          route: r,
          params
        });
      }
    }
  }

  return null;
}

function matchRoute(path) {
  return CONFIG.matcher === "trie"
    ? matchTrie(path)
    : matchSimple(path);
}

// ==============================
// END ROUTE LOGIC
// ==============================

function isEndRoute(route, ctx) {
  if (!route) {
    return false;
  }

  if (typeof route.end === "function") {
    return !!route.end(ctx);
  }

  return !!route.end;
}

// ==============================
// NAVIGATION GUARDS
// ==============================

function canNavigate(ctx) {
  if (!current || !current.canLeave) {
    return true;
  }

  return current.canLeave(ctx);
}

// ==============================
// CORE NAVIGATION ENGINE
// ==============================

function run(fullPath, type) {
  const [pathname, search = ""] = fullPath.split("?");

  const cleanPath = stripBase(normalizePath(pathname));
  const query = parseQuery(search);

  const match = matchRoute(cleanPath);

  const ctx = {
    path: cleanPath,
    params: match?.params || {},
    query,
    from: current?.path || null,
    to: cleanPath,
    type
  };

  runMiddlewares(ctx, () => {

    // Guard fallback for browser-triggered popstate navigation.
    // Push/replace navigation is already validated before history mutation.

    if (type === "pop" && current && current.canLeave) {
      const allowed = current.canLeave(ctx);

      if (!allowed) {
        // For testing, just return without rollback
        return;
      }
    }

    // Exit lifecycle

    if (current) {
      if (type === "pop" && current.onReturn) {
        current.onReturn(ctx);
      }

      if (current.onExit) {
        current.onExit(ctx);
      }
    }

    // Not found handling

    if (!match) {
      if (notFoundHandler) {
        notFoundHandler(ctx);
      } else {
        console.warn("Route not found:", cleanPath);
      }

      return;
    }

    // Activate next route

    const next = match.route;

    current = next;

    // Entry lifecycle

    if (type === "pop") {
      if (next.onComeback) {
        next.onComeback(ctx);
      }
    } else {
      if (next.onArrive) {
        next.onArrive(ctx);
      }
    }

    if (next.onMeet) {
      next.onMeet(ctx);
    }
  });
}

// ==============================
// ROUTE REGISTRATION
// ==============================

function router(path, handler) {

  if (typeof handler === "function") {
    handler = {
      onMeet: handler
    };
  }

  const compiled = compileRoute(
    normalizePath(path),
    handler
  );

  routes.push({
    ...compiled,
    onMeet: handler?.onMeet || (() => {}),
    onArrive: handler?.onArrive || null,
    onExit: handler?.onExit || null,
    onReturn: handler?.onReturn || null,
    onComeback: handler?.onComeback || null,
    canLeave: handler?.canLeave || null,
    end: handler?.end ?? false
  });

  if (CONFIG.matcher === "trie") {
    addToTrie(compiled);
  }

  // Reset cache when routes change.

  routeCache = Object.create(null);

  return this;
}

// ==============================
// NAVIGATION METHODS
// ==============================

function navigatePush(path, state = {}) {

  const cleanPath = normalizePath(path);

  const ctx = {
    path: cleanPath,
    from: current?.path || null,
    to: cleanPath,
    type: "push",
    query: {}
  };

  // Block navigation BEFORE mutating browser history.

  if (!canNavigate(ctx)) {
    return;
  }

  const url = buildURL(cleanPath);

  // For testing, just run
  run(cleanPath, "push");
}

function navigateReplace(path, state = {}) {

  const cleanPath = normalizePath(path);

  const ctx = {
    path: cleanPath,
    from: current?.path || null,
    to: cleanPath,
    type: "replace",
    query: {}
  };

  // Block navigation BEFORE mutating browser history.

  if (!canNavigate(ctx)) {
    return;
  }

  const url = buildURL(cleanPath);

  // For testing, just run
  run(cleanPath, "replace");
}

function navigatePop() {
  // For testing, simulate
  run("/", "pop");
}

function navigate(path, type = "push") {
  const cleanPath = stripBase(normalizePath(path));
  const match = matchRoute(cleanPath);

  const ctx = {
    path: cleanPath,
    params: match?.params || {},
    from: current?.path || null,
    to: cleanPath,
    type
  };

  if (!match) {
    if (notFoundHandler) {
      notFoundHandler(ctx);
    }
    return null;
  }

  current = match.route;

  if (match.route.onMeet) {
    match.route.onMeet(ctx);
  }

  return ctx;
}

// ==============================
// BROWSER EXTENSION
// ==============================

if (typeof window !== 'undefined' && typeof History !== 'undefined') {
  History.prototype.config = config;
  History.prototype.use = use;
  History.prototype.notFound = notFound;
  History.prototype.router = router;
  History.prototype.navigatePush = navigatePush;
  History.prototype.navigateReplace = navigateReplace;
  History.prototype.navigatePop = navigatePop;

  // ==============================
  // BROWSER EVENTS
  // ==============================

  window.addEventListener("popstate", () => {

    if (CONFIG.mode !== "history") {
      return;
    }

    const ctx = {
      path: current?.path,
      from: current?.path,
      to: null,
      type: "pop",
      query: {}
    };

    // Simulate mobile-style exit behavior.

    if (current && isEndRoute(current, ctx)) {
      history.go(-1);
      return;
    }

    run(location.pathname + location.search, "pop");
  });

  window.addEventListener("hashchange", () => {

    if (CONFIG.mode === "hash") {
      run(getCurrentPath(), "pop");
    }

  });
}

// ==============================
// EXPORTS
// ==============================

export function createEngine() {
  // Reset state for testing isolation
  routes = [];
  middlewares = [];
  current = null;
  notFoundHandler = null;
  CONFIG = {
    base: "",
    mode: "history",
    matcher: "simple"
  };
  routeCache = Object.create(null);
  trieRoot = {};

  return {
    config,
    use,
    notFound,
    router,
    navigatePush,
    navigateReplace,
    navigatePop,
    navigate,
    matchRoute,
    _internal: {
      routes,
      current,
      routeCache,
      trieRoot
    }
  };
}
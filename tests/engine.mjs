// ==============================
// History++ Core (Pure ESM for testing)
// Based on v1.0.3
// ==============================

export function createEngine() {
  let routes = [];
  let current = null;
  let notFoundHandler = null;

  let CONFIG = {
    base: "",
    mode: "history",
    matcher: "simple"
  };

  let routeCache = Object.create(null);
  const trieRoot = {};

  function config(options = {}) {
    CONFIG.base = options.base || "";
    CONFIG.mode = options.mode || "history";
    CONFIG.matcher = options.matcher || "simple";
  }

  function notFound(handler) {
    if (typeof handler === "function") {
      notFoundHandler = handler;
    }
  }

  function normalizePath(path) {
    if (!path) return "/";
    if (!path.startsWith("/")) path = "/" + path;
    return path;
  }

  function stripBase(path) {
    if (CONFIG.base && path.startsWith(CONFIG.base)) {
      const p = path.slice(CONFIG.base.length);
      return p || "/";
    }
    return path;
  }

  function compileRoute(path, handler = {}) {
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
      onMeet: handler?.onMeet || null
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

    if (!node.route) return null;
    return { route: node.route, params };
  }

  function matchSimple(path) {
    path = normalizePath(path);

    if (routeCache[path]) return routeCache[path];

    for (const r of routes) {
      if (!r.isDynamic && r.path === path) {
        return (routeCache[path] = { route: r, params: {} });
      }

      if (r.isDynamic) {
        const match = path.match(r.regex);
        if (match) {
          const params = {};
          r.keys.forEach((k, i) => {
            params[k] = match[i + 1];
          });

          return (routeCache[path] = { route: r, params });
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

  function router(path, handler = {}) {
    const compiled = compileRoute(normalizePath(path), handler);

    routes.push(compiled);

    if (CONFIG.matcher === "trie") {
      addToTrie(compiled);
    }

    routeCache = Object.create(null);
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

  return {
    config,
    router,
    matchRoute,
    navigate,
    notFound,
    _internal: {
      routeCache,
      trieRoot
    }
  };
}
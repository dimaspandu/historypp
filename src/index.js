// ==============================
// History++ Core (Path Layer Ready)
// ==============================

(function () {
  const routes = [];
  let current = null;

  // ==============================
  // CONFIG
  // ==============================

  let CONFIG = {
    base: "",
    mode: "history" // "history" | "hash"
  };

  /**
   * Configure router behavior.
   * - base: base path prefix (e.g. "/examples/app")
   * - mode: "history" (default) or "hash"
   */
  History.prototype.config = function (options = {}) {
    CONFIG.base = options.base || "";
    CONFIG.mode = options.mode || "history";
  };

  // ==============================
  // PATH MANAGER
  // ==============================

  /**
   * Ensure path consistency.
   * - Always starts with "/"
   * - Removes accidental "#" prefix
   */
  function normalizePath(path) {
    if (!path) return "/";

    if (path.startsWith("#")) {
      path = path.slice(1);
    }

    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    return path;
  }

  /**
   * Remove base prefix before route matching.
   * Example:
   *   base = "/examples/app"
   *   "/examples/app/about" -> "/about"
   */
  function stripBase(path) {
    if (CONFIG.base && path.startsWith(CONFIG.base)) {
      const stripped = path.slice(CONFIG.base.length);
      return stripped || "/";
    }
    return path;
  }

  /**
   * Add base prefix when building URLs.
   */
  function addBase(path) {
    if (!CONFIG.base) return path;
    if (path.startsWith(CONFIG.base)) return path;
    return CONFIG.base + path;
  }

  /**
   * Parse query string into object.
   */
  function parseQuery(search = "") {
    const query = {};
    const params = new URLSearchParams(search);

    for (const [k, v] of params.entries()) {
      query[k] = v;
    }

    return query;
  }

  /**
   * Build final URL based on mode and base.
   */
  function buildURL(path) {
    path = normalizePath(path);

    if (CONFIG.mode === "hash") {
      return "/#" + path;
    }

    return addBase(path);
  }

  /**
   * Read current path from browser depending on mode.
   */
  function getCurrentPath() {
    if (CONFIG.mode === "hash") {
      const hash = location.hash.replace(/^#/, "");
      return normalizePath(hash || "/");
    }

    return normalizePath(location.pathname + location.search);
  }

  // ==============================
  // ROUTE MATCHER
  // ==============================

  /**
   * Match route against registered routes.
   * Supports:
   * - exact match
   * - dynamic params (/user/:id)
   */
  function matchRoute(path) {
    path = normalizePath(path);

    for (const r of routes) {
      // exact match
      if (r.path === path) {
        return { route: r, params: {} };
      }

      // dynamic match
      if (r.path.includes(":")) {
        const keys = [];

        const pattern = r.path.replace(/:([^/]+)/g, (_, key) => {
          keys.push(key);
          return "([^/]+)";
        });

        const regex = new RegExp("^" + pattern + "$");
        const match = path.match(regex);

        if (match) {
          const params = {};
          keys.forEach((k, i) => {
            params[k] = match[i + 1];
          });

          return { route: r, params };
        }
      }
    }

    return null;
  }

  // ==============================
  // CORE RUNNER
  // ==============================

  /**
   * Core navigation executor.
   *
   * Important design note:
   * Browser "popstate" cannot be cancelled.
   * Therefore, when canLeave() returns false on a "pop",
   * we simulate cancellation by restoring the previous URL
   * using replaceState (history mode) or hash overwrite (hash mode).
   */
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

    // ==============================
    // GUARD (canLeave)
    // ==============================

    if (current && current.canLeave) {
      const allowed = current.canLeave(ctx);

      if (!allowed) {
        /**
         * IMPORTANT:
         * We cannot cancel popstate.
         * Instead, we rollback the URL to the current route.
         *
         * This makes canLeave behave like a true navigation guard.
         */
        if (type === "pop" && current) {
          const rollbackURL = buildURL(current.path);

          if (CONFIG.mode === "hash") {
            // restore hash without adding history entry
            location.replace("#" + current.path);
          } else {
            // replace current history entry without growing stack
            history.replaceState(history.state, "", rollbackURL);
          }
        }

        return;
      }
    }

    // ==============================
    // EXIT HOOK
    // ==============================

    if (current && current.onExit) {
      current.onExit(ctx);
    }

    if (!match) {
      console.warn("Route not found:", cleanPath);
      return;
    }

    const next = match.route;
    current = next;

    // ==============================
    // ENTER (onMeet)
    // ==============================

    if (next.onMeet) {
      next.onMeet(ctx);
    }
  }

  // ==============================
  // ROUTER API
  // ==============================

  /**
   * Register a route.
   *
   * Supports:
   * - function shorthand → onMeet
   * - object lifecycle definition
   */
  History.prototype.router = function (path, handler) {
    if (typeof handler === "function") {
      handler = { onMeet: handler };
    }

    routes.push({
      path: normalizePath(path),
      onMeet: handler?.onMeet || (() => {}),
      onExit: handler?.onExit || null,
      canLeave: handler?.canLeave || null
    });

    return this;
  };

  // ==============================
  // NAVIGATION METHODS
  // ==============================

  /**
   * Push navigation (adds new history entry)
   */
  History.prototype.navigatePush = function (path, state = {}) {
    const url = buildURL(path);

    if (CONFIG.mode === "hash") {
      const clean = url.replace("/#", "");
      location.hash = clean;
      run(clean, "push");
      return;
    }

    history.pushState(state, "", url);
    run(url, "push");
  };

  /**
   * Replace navigation (does not add new entry)
   */
  History.prototype.navigateReplace = function (path, state = {}) {
    const url = buildURL(path);

    if (CONFIG.mode === "hash") {
      const clean = url.replace("/#", "");
      location.replace("#" + clean);
      run(clean, "replace");
      return;
    }

    history.replaceState(state, "", url);
    run(url, "replace");
  };

  /**
   * Pop navigation (delegates to browser)
   */
  History.prototype.navigatePop = function () {
    history.back();
  };

  // ==============================
  // EVENTS
  // ==============================

  /**
   * popstate cannot be cancelled.
   * Router must adapt after it happens.
   */
  window.addEventListener("popstate", () => {
    if (CONFIG.mode === "history") {
      run(location.pathname + location.search, "pop");
    }
  });

  /**
   * Hash mode equivalent of popstate.
   */
  window.addEventListener("hashchange", () => {
    if (CONFIG.mode === "hash") {
      run(getCurrentPath(), "pop");
    }
  });

})();
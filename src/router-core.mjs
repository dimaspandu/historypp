// ==============================
// History++ Core (Modular ESM Version for Testing)
// ==============================

class RouterCore {
  constructor() {
    this.routes = [];
    this.middlewares = [];
    this.current = null;
    this.CONFIG = {
      base: "",
      mode: "history"
    };
  }

  config(options = {}) {
    this.CONFIG.base = options.base || "";
    this.CONFIG.mode = options.mode || "history";
  }

  use(fn) {
    this.middlewares.push(fn);
  }

  router(path, handler) {
    // Normalize path (same as original)
    if (!path.startsWith("/")) path = "/" + path;
    path = path.replace(/\/$/, "") || "/";

    // Split path into segments for Trie matching
    const segments = path.split("/").filter(Boolean);

    this.routes.push({
      path: path,
      segments: segments,
      handler: handler || {},
      isDynamic: segments.some(seg => seg.startsWith(":")),
      end: handler?.end || false
    });
  }

  // Path utilities (same as original)
  normalizePath(path) {
    if (!path.startsWith("/")) path = "/" + path;
    return path.replace(/\/$/, "") || "/";
  }

  stripBase(path) {
    const base = this.CONFIG.base;
    if (base && path.startsWith(base)) {
      return path.slice(base.length) || "/";
    }
    return path;
  }

  applyBase(path) {
    const base = this.CONFIG.base;
    if (base && !path.startsWith(base)) {
      return base + path;
    }
    return path;
  }

  // Route matching with Trie-like logic (same as original)
  matchRoute(cleanPath) {
    const pathSegments = cleanPath.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (this.matchSegments(route.segments, pathSegments)) {
        // Extract params
        const params = {};
        if (route.isDynamic) {
          for (let i = 0; i < route.segments.length; i++) {
            const seg = route.segments[i];
            if (seg.startsWith(":")) {
              params[seg.slice(1)] = pathSegments[i];
            }
          }
        }

        return {
          route: route,
          params: params
        };
      }
    }

    return null;
  }

  matchSegments(routeSegments, pathSegments) {
    if (routeSegments.length !== pathSegments.length) return false;

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSeg = routeSegments[i];
      const pathSeg = pathSegments[i];

      if (routeSeg.startsWith(":")) continue; // dynamic param
      if (routeSeg !== pathSeg) return false;
    }

    return true;
  }

  // Navigation methods (same as original)
  navigatePush(path, state) {
    this.navigate(path, "push", state);
  }

  navigateReplace(path, state) {
    this.navigate(path, "replace", state);
  }

  navigatePop() {
    // Simplified pop navigation
    if (this.current) {
      this.navigate(this.current.path, "pop");
    }
  }

  // Internal navigate (same as original logic)
  navigate(path, type = "push", state = null) {
    const cleanPath = this.stripBase(this.normalizePath(path));

    const match = this.matchRoute(cleanPath);
    if (!match) {
      console.warn("Route not found:", cleanPath);
      return;
    }

    const ctx = {
      path: cleanPath,
      params: match.params,
      query: {}, // simplified
      state: state,
      from: this.current?.path || null,
      to: cleanPath,
      type: type
    };

    // Run middlewares
    this.runMiddlewares(ctx, () => {
      // Guard check
      if (this.current && this.current.handler.canLeave) {
        if (!this.current.handler.canLeave(ctx)) {
          if (type === "pop") {
            // Restore URL (simplified)
            console.log("Blocked pop navigation");
          }
          return;
        }
      }

      // End route check (simplified)
      if (this.current && this.isEndRoute(this.current, ctx)) {
        // Let browser handle back
        console.log("End route reached, letting browser handle");
        return;
      }

      // Lifecycle
      if (this.current) {
        if (type === "pop" && this.current.handler.onReturn) {
          this.current.handler.onReturn(ctx);
        }
        if (this.current.handler.onExit) {
          this.current.handler.onExit(ctx);
        }
      }

      const next = match.route;
      this.current = next;

      if (type === "pop") {
        if (next.handler.onComeback) {
          next.handler.onComeback(ctx);
        }
      } else {
        if (next.handler.onArrive) {
          next.handler.onArrive(ctx);
        }
      }

      if (next.handler.onMeet) {
        next.handler.onMeet(ctx);
      }
    });
  }

  isEndRoute(route, ctx) {
    if (!route) return false;
    return route.end === true || (typeof route.end === 'function' && route.end(ctx));
  }

  runMiddlewares(ctx, finalHandler) {
    let index = -1;

    const dispatch = (i) => {
      if (i <= index) return;
      index = i;

      const mw = this.middlewares[i];
      if (!mw) {
        return finalHandler();
      }

      return mw(ctx, () => dispatch(i + 1));
    };

    dispatch(0);
  }
}

export default RouterCore;
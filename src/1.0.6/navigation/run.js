import { normalizePath, stripBase, buildURL } from "../utils/path.js";
import { parseQuery } from "../utils/query.js";
import { runMiddlewares } from "../middleware/run-middlewares.js";
import { matchRoute } from "../matcher/match-route.js";

export function run(state, fullPath, type) {

  const [pathname, search = ""] = fullPath.split("?");

  const cleanPath = stripBase(
    normalizePath(pathname),
    state.config.base
  );

  const query = parseQuery(search);

  const match = matchRoute(cleanPath, state);

  // Two separate concepts, kept apart so lifecycle hooks can combine them:
  //
  //   ctx.firstArrive  — true only on the very first run() call of the
  //                      session. One-shot: true even when that first call
  //                      is a not-found, then always false.
  //
  //   ctx.isInitialRoute — true when the matched route is the one that
  //                      handled the initial URL. Persistent: stays true
  //                      every time the same pattern is visited again
  //                      (e.g. back/forward), even though firstArrive
  //                      will be false on those returns.
  //
  // Use `ctx.firstArrive && ctx.isInitialRoute` to detect a load whose
  // DOM was already rendered by the server. On a later return to the
  // same pattern the DOM may have been overwritten, so firstArrive
  // being false forces a fetch + re-render.
  const firstArrive = !state.firstRunDone;
  state.firstRunDone = true;

  const isInitialRoute =
    !!match &&
    (state.initialRoute
      ? match.route === state.initialRoute
      : firstArrive);

  const ctx = {
    path: cleanPath,
    params: match?.params || {},
    query,
    firstArrive,
    isInitialRoute,
    from: state.current?.path || null,
    to: cleanPath,
    type
  };

  runMiddlewares(state.middlewares, ctx, () => {

    if (type === "pop" &&
        state.current &&
        state.current.canLeave) {

      const allowed = state.current.canLeave(ctx);

      if (!allowed) {

        const rollbackURL = buildURL(
          state.current.path,
          state.config
        );

        if (state.config.mode === "hash") {
          location.replace("#" + state.current.path);
        } else {
          history.pushState(history.state, "", rollbackURL);
        }

        return;
      }
    }

    if (state.current) {

      if (type === "pop" &&
          state.current.onReturn) {

        state.current.onReturn(ctx);
      }

      if (state.current.onExit) {
        state.current.onExit(ctx);
      }
    }

    if (!match) {

      if (state.notFoundHandler) {
        state.notFoundHandler(ctx);
      }

      return;
    }

    const next = match.route;

    state.current = next;

    // Remember the initial route object so later visits to the same
    // pattern can still be flagged as isInitialRoute.
    if (state.initialRoute === null) {
      state.initialRoute = next;
    }

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
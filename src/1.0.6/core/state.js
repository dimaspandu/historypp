export function createState() {
  return {
    routes: [],
    middlewares: [],
    current: null,
    notFoundHandler: null,

    config: {
      base: "",
      mode: "history",
      matcher: "simple"
    },

    routeCache: Object.create(null),

    trieRoot: {},

    // Whether the very first run() call has already fired (the initial URL).
    // Used to stamp ctx.firstArrive on that one transition.
    firstRunDone: false,

    // The route object matched by the initial URL, if any. Kept so that
    // later back/forward visits to the same pattern can still be flagged
    // as ctx.isInitialRoute (persistent), even though ctx.firstArrive
    // will be false on those returns.
    initialRoute: null
  };
}
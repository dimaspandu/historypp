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

    // Tracks whether the first successful route match has already fired.
    // Used only to stamp ctx.isInitialRoute on that one transition.
    firstMatchDone: false
  };
}
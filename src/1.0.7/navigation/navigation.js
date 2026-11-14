import { normalizePath, stripBase, buildURL } from "../utils/path.js";
import { matchRoute } from "../matcher/match-route.js";
import { canNavigate } from "./guards.js";
import { run } from "./run.js";

function buildNavContext(state, path, type) {
  const cleanPath = normalizePath(path);
  const [pathOnly, search = ""] = cleanPath.split("?");
  const cleanBasePath = stripBase(normalizePath(pathOnly), state.config.base);
  const match = matchRoute(cleanBasePath, state);

  const isSameRoute =
    !!match &&
    state.firstRunDone &&
    state.current === match.route;

  const isSelfNavigate =
    (type === "push" || type === "replace") &&
    isSameRoute;

  const isSameURL =
    state.firstRunDone &&
    state.currentPath === pathOnly &&
    state.currentSearch === search;

  return {
    path: pathOnly,
    params: match?.params || {},
    query: {},
    search,
    firstArrive: !state.firstRunDone,
    isInitialRoute:
      !!match &&
      (state.initialRoute
        ? match.route === state.initialRoute
        : !state.firstRunDone),
    isSameRoute,
    isSelfNavigate,
    isSameURL,
    from: state.currentPath || state.current?.path || null,
    to: pathOnly,
    type
  };
}

export function navigatePush(state, path, data = {}) {

  const cleanPath = normalizePath(path);
  const ctx = buildNavContext(state, cleanPath, "push");

  if (!canNavigate(state.current, ctx)) {
    return;
  }

  const url = buildURL(cleanPath, state.config);

  if (typeof window === "undefined") {
    // Node.js: just run without URL changes
    run(state, cleanPath, "push");
    return;
  }

  if (state.config.mode === "hash") {

    const clean = url.replace("/#", "");

    location.hash = clean;

    run(state, clean, "push");

    return;
  }

  history.pushState(data, "", url);

  run(state, url, "push");
}

export function navigateReplace(state, path, data = {}) {

  const cleanPath = normalizePath(path);
  const ctx = buildNavContext(state, cleanPath, "replace");

  if (!canNavigate(state.current, ctx)) {
    return;
  }

  const url = buildURL(cleanPath, state.config);

  if (typeof window === "undefined") {
    // Node.js: just run without URL changes
    run(state, cleanPath, "replace");
    return;
  }

  if (state.config.mode === "hash") {

    const clean = url.replace("/#", "");

    location.replace("#" + clean);

    run(state, clean, "replace");

    return;
  }

  history.replaceState(data, "", url);

  run(state, url, "replace");
}

export function navigatePop() {
  if (typeof window !== "undefined") {
    history.back();
  }
}
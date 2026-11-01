# AGENTS.md — Release Checklist

Every update (feature, bugfix, docs, chore) must follow this order:

1. **Change code / docs** in `src/1.0.6/`, `examples/`, `README.md`, `CHANGELOG.md`, etc.
2. **Run tests**: `npm test` (must be 9/9 pass).
3. **Bump `package.json` version** (e.g. `2.0.x` → `2.0.x+1`).
4. **Update `CHANGELOG.md`** with an entry `[2.0.x] - YYYY-MM-DD` above older entries.
5. **Update `README.md`** whenever usage changes (install, scripts, API). Do not leave `node server.js`/`node tests/index.js` — use `npm run dev` / `npm run test`.
6. **Commit** with a conventional message (`feat:`, `fix:`, `docs:`, `chore:`).
7. **Push to `main`**: `git push origin main`.
8. **Create tag**: `git tag -a v2.0.x -m "Release 2.0.x: <short description>"`.
9. **Push tag**: `git push origin v2.0.x`.
10. **Publish to npm**: `npm publish --access public` (ensure a bypass-2FA token).
11. **Verify**: `npm view historyplusplus@2.0.x` (homepage, scripts, version).
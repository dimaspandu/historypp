# AGENTS.md — Release Checklist

Setiap update (fitur, bugfix, docs, chore) harus mengikuti urutan ini:

1. **Ubah kode / docs** di `src/1.0.6/`, `examples/`, `README.md`, `CHANGELOG.md`, dll.
2. **Jalankan test**: `npm test` (harus 9/9 pass).
3. **Bump `package.json` version** (contoh `2.0.x` → `2.0.x+1`).
4. **Update `CHANGELOG.md`** dengan entry `[2.0.x] - YYYY-MM-DD` di atas entries lama.
5. **Update `README.md`** jika ada perubahan cara pakai (install, scripts, API). Jangan tinggal `node server.js`/`node tests/index.js` — gunakan `npm run dev` / `npm run test`.
6. **Commit** dengan pesan conventional (`feat:`, `fix:`, `docs:`, `chore:`).
7. **Push ke `main`**: `git push origin main`.
8. **Buat tag**: `git tag -a v2.0.x -m "Release 2.0.x: <desk singkat>"`.
9. **Push tag**: `git push origin v2.0.x`.
10. **Publish ke npm**: `npm publish --access public` (pastikan token bypass-2FA).
11. **Verifikasi**: `npm view historyplusplus@2.0.x` (homepage, scripts, version).
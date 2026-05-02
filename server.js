import { createServer } from "http";
import { existsSync, createReadStream, statSync } from "fs";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 5173;

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

// ==============================
// SERVE FILE
// ==============================

function serveFile(res, filePath) {
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || "text/plain";

  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
}

// ==============================
// FIND NEAREST INDEX (SPA fallback)
// ==============================

function findNearestIndex(baseDir, urlPath) {
  let currentPath = join(baseDir, urlPath);

  while (true) {
    const indexPath = join(currentPath, "index.html");

    if (existsSync(indexPath)) {
      return indexPath;
    }

    const parent = dirname(currentPath);

    if (parent === currentPath || parent === baseDir) {
      break;
    }

    currentPath = parent;
  }

  return null;
}

// ==============================
// SERVER
// ==============================

createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  console.log("REQ:", urlPath);

  // =========================
  // ROOT
  // =========================
  if (urlPath === "/") {
    return serveFile(res, join(__dirname, "examples/index.html"));
  }

  const filePath = join(__dirname, urlPath);

  // =========================
  // 1. DIRECT STATIC FILE
  // =========================
  if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
    return serveFile(res, filePath);
  }

  // =========================
  // 2. DIRECTORY → index.html
  // =========================
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    return serveFile(res, join(filePath, "index.html"));
  }

  // =========================
  // 3. HTML ROUTE SUPPORT (NEW)
  // /about → /about.html
  // =========================
  const htmlFile = join(__dirname, urlPath + ".html");

  if (existsSync(htmlFile)) {
    return serveFile(res, htmlFile);
  }

  // =========================
  // 4. SMART SPA FALLBACK
  // =========================
  if (urlPath.startsWith("/examples/")) {
    const found = findNearestIndex(__dirname, urlPath);

    if (found) {
      return serveFile(res, found);
    }
  }

  // =========================
  // NOT FOUND
  // =========================
  res.writeHead(404);
  res.end("Not found");

}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
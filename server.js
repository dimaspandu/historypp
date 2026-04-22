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

createServer((req, res) => {
  let urlPath = req.url.split("?")[0];

  console.log("REQ:", urlPath);

  // root → examples index
  if (urlPath === "/") {
    return serveFile(res, join(__dirname, "examples/index.html"));
  }

  const filePath = join(__dirname, urlPath);

  // direct file
  if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
    return serveFile(res, filePath);
  }

  // folder → index.html
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    return serveFile(res, join(filePath, "index.html"));
  }

  // =========================
  // SPA fallback for examples
  // =========================
  if (urlPath.startsWith("/examples/")) {
    const parts = urlPath.split("/");
    const exampleBase = parts.slice(0, 3).join("/"); 
    // /examples/01-basic-routing

    return serveFile(
      res,
      join(__dirname, exampleBase, "index.html")
    );
  }

  res.writeHead(404);
  res.end("Not found");

}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
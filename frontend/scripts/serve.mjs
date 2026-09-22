import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("out");
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }
      try {
        if ((await fs.stat(file)).isDirectory())
          file = path.join(file, "index.html");
      } catch {
        if (!path.extname(file)) file = path.join(file, "index.html");
      }
      const data = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        await fs
          .readFile(path.join(root, "404.html"))
          .catch(() => Buffer.from("Page not found")),
      );
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`GigKaro is ready at http://127.0.0.1:${port}`),
  );

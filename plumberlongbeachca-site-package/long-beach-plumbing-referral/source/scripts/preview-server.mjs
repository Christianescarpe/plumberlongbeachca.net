import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 41731);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, {
    "Content-Type": type,
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.includes("\0") || pathname.includes("..")) return send(res, 400, "Bad path");
  const relative = pathname.replace(/^\/+/, "");
  let file = path.resolve(root, relative);
  if (!file.startsWith(root)) return send(res, 400, "Bad path");
  if (pathname.endsWith("/")) file = path.join(file, "index.html");
  else if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    res.writeHead(302, { Location: `${pathname}/` });
    return res.end();
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const missing = path.join(root, "404.html");
    return send(res, 404, fs.readFileSync(missing), "text/html; charset=utf-8");
  }
  send(res, 200, fs.readFileSync(file), types[path.extname(file)] || "application/octet-stream");
});

server.listen(port, host, () => {
  console.log(`Preview http://${host}:${port}/`);
});

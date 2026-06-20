import { fileURLToPath, pathToFileURL } from "node:url";
import { join, dirname } from "node:path";

// Vercel serverless function that wraps the TanStack Start SSR handler.
// The built server uses the WinterCG Fetch API interface, so we bridge it to
// Vercel's Node.js (req/res) interface here.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the server entry relative to this file (api/ -> dist/server/)
const serverPath = join(__dirname, "..", "dist", "server", "server.js");

let handlerPromise;

async function getHandler() {
  if (!handlerPromise) {
    // pathToFileURL is required for dynamic import on Windows (file:// scheme needed)
    handlerPromise = import(pathToFileURL(serverPath).href).then((m) => m.default ?? m);
  }
  return handlerPromise;
}

/**
 * Convert a Node.js IncomingMessage to a WinterCG Request.
 */
async function toFetchRequest(req) {
  const host = req.headers["host"] || "localhost";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const url = `${protocol}://${host}${req.url}`;

  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue;
    if (Array.isArray(val)) {
      for (const v of val) headers.append(key, v);
    } else {
      headers.set(key, val);
    }
  }

  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  let body = undefined;
  if (hasBody) {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
  }

  return new Request(url, { method, headers, body: hasBody ? body : undefined });
}

/**
 * Write a WinterCG Response back to a Node.js ServerResponse.
 */
async function fromFetchResponse(fetchRes, res) {
  res.statusCode = fetchRes.status;
  for (const [key, val] of fetchRes.headers.entries()) {
    res.setHeader(key, val);
  }
  if (fetchRes.body) {
    const reader = fetchRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const server = await getHandler();
    const fetchReq = await toFetchRequest(req);
    const fetchRes = await server.fetch(fetchReq, process.env, {});
    await fromFetchResponse(fetchRes, res);
  } catch (err) {
    console.error("[SSR] handler error:", err?.stack ?? err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end(`Internal Server Error\n\n${err?.message ?? err}`);
  }
}

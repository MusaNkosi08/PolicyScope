import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleAnalyzeRequest } from "../shared/handler.js";

// Load .env if present (Node 20.12+). Real environment variables take precedence.
try {
  process.loadEnvFile?.(".env");
} catch {
  /* no .env file: rely on the environment */
}

const app = express();
const port = Number(process.env.API_PORT ?? process.env.PORT ?? 8787);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

app.disable("x-powered-by");
app.use(express.json({ limit: "512kb" }));

// Small in-memory rate limiter: 10 analyses per IP per minute.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map<string, number[]>();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    res.setHeader("Retry-After", Math.ceil((WINDOW_MS - (now - recent[0])) / 1000));
    return res.status(429).json({
      ok: false,
      error: { code: "rate_limited", message: "Too many analyses in a short time. Wait a minute and try again." },
    });
  }
  recent.push(now);
  hits.set(key, recent);
  next();
}

app.post("/api/analyze", rateLimit, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const result = await handleAnalyzeRequest(req.body);
  res.status(result.status).json(result.body);
});

app.all("/api/analyze", (_req, res) => {
  res.setHeader("Allow", "POST");
  res.status(405).json({ ok: false, error: { code: "method_not_allowed", message: "Use POST." } });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

// Malformed JSON bodies and other errors
app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: { code: "invalid_input", message: "Request body must be JSON." } });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ ok: false, error: { code: "invalid_input", message: "That text is too long." } });
  }
  console.error("[policyscope] server error", err);
  res.status(500).json({ ok: false, error: { code: "unknown", message: "An unexpected error occurred." } });
});

// Serve the built client in production (after `npm run build`).
if (existsSync(distDir)) {
  app.use(express.static(distDir, { index: false, maxAge: "1h" }));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(port, () => {
  console.log(`[policyscope] API listening on http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[policyscope] ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.");
  }
});

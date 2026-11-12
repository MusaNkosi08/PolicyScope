import { AnalyzeError, analyzeDocument } from "./analyze.js";
import { AnalyzeRequestSchema, type AnalyzeResponse } from "./schema.js";

export interface HandlerResult {
  status: number;
  body: AnalyzeResponse;
}

/** Framework-agnostic request handler shared by the Vercel function and the Express server. */
export async function handleAnalyzeRequest(body: unknown): Promise<HandlerResult> {
  const input = AnalyzeRequestSchema.safeParse(body ?? {});
  if (!input.success) {
    return {
      status: 400,
      body: {
        ok: false,
        error: { code: "invalid_input", message: input.error.issues[0]?.message ?? "Invalid request." },
      },
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[policyscope] ANTHROPIC_API_KEY is not set");
    return {
      status: 500,
      body: {
        ok: false,
        error: { code: "server_misconfigured", message: "The server is missing its API key. Set ANTHROPIC_API_KEY." },
      },
    };
  }

  const started = Date.now();
  try {
    const result = await analyzeDocument(input.data.text, {
      apiKey,
      model: process.env.ANTHROPIC_MODEL,
    });
    return {
      status: 200,
      body: {
        ok: true,
        dossier: result.dossier,
        meta: { model: result.model, elapsedMs: Date.now() - started, repaired: result.repaired },
      },
    };
  } catch (err) {
    const e =
      err instanceof AnalyzeError
        ? err
        : new AnalyzeError(500, "unknown", "An unexpected error occurred.");
    if (!(err instanceof AnalyzeError)) console.error("[policyscope] unexpected error", err);
    return { status: e.status, body: { ok: false, error: { code: e.code, message: e.message } } };
  }
}

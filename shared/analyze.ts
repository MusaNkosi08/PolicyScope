import Anthropic from "@anthropic-ai/sdk";
import type { ZodError } from "zod";
import { DossierSchema, type ApiErrorCode, type Dossier } from "./schema.js";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt.js";

export const DEFAULT_MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 4096;

export class AnalyzeError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AnalyzeError";
  }
}

type ParseResult = { ok: true; dossier: Dossier } | { ok: false; problem: string };

/** Pulls the outermost JSON object out of a model reply, tolerating stray fences or prose. */
export function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new SyntaxError("No JSON object found in the reply.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function describeZodError(err: ZodError): string {
  return err.issues
    .slice(0, 12)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export function parseDossier(raw: string): ParseResult {
  let json: unknown;
  try {
    json = extractJson(raw);
  } catch (e) {
    return { ok: false, problem: `The reply was not parseable JSON (${(e as Error).message}).` };
  }
  const result = DossierSchema.safeParse(json);
  if (!result.success) return { ok: false, problem: describeZodError(result.error) };
  return { ok: true, dossier: result.data };
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function mapUpstreamError(err: unknown): AnalyzeError {
  if (err instanceof AnalyzeError) return err;
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return new AnalyzeError(504, "upstream_timeout", "The analysis took too long. Try a shorter excerpt.");
  }
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    if (status === 401 || status === 403) {
      return new AnalyzeError(500, "server_misconfigured", "The server's API credentials were rejected.");
    }
    if (status === 404) {
      return new AnalyzeError(500, "server_misconfigured", "The configured model is not available. Check ANTHROPIC_MODEL.");
    }
    if (status === 429) {
      return new AnalyzeError(429, "rate_limited", "Too many requests right now. Wait a moment and try again.");
    }
    if (status === 529 || status === 503) {
      return new AnalyzeError(503, "upstream_overloaded", "The analysis service is busy. Try again in a minute.");
    }
    if (status === 400) {
      return new AnalyzeError(400, "invalid_input", "The analysis service could not accept that text.");
    }
    return new AnalyzeError(502, "upstream_error", "The analysis service returned an error.");
  }
  return new AnalyzeError(502, "upstream_error", "Something went wrong while contacting the analysis service.");
}

export interface AnalyzeOptions {
  apiKey: string;
  model?: string;
}

export interface AnalyzeOutput {
  dossier: Dossier;
  model: string;
  repaired: boolean;
}

/**
 * Calls Claude with the PolicyScope system prompt and validates the reply with Zod.
 * If the first reply fails validation, asks the model once to correct it.
 */
export async function analyzeDocument(documentText: string, opts: AnalyzeOptions): Promise<AnalyzeOutput> {
  const model = opts.model || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey: opts.apiKey, timeout: 55_000, maxRetries: 1 });

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: buildUserMessage(documentText) }];

  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: Anthropic.Message;
    try {
      reply = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
      });
    } catch (err) {
      throw mapUpstreamError(err);
    }

    const raw = textOf(reply);
    const parsed = parseDossier(raw);
    if (parsed.ok) return { dossier: parsed.dossier, model: reply.model, repaired: attempt > 0 };

    if (reply.stop_reason === "max_tokens") {
      throw new AnalyzeError(
        502,
        "output_truncated",
        "The dossier for this document ran past the length limit. Try analyzing a shorter section.",
      );
    }

    if (attempt === 0) {
      console.warn(`[policyscope] invalid model output, requesting repair: ${parsed.problem}`);
      messages.push(
        { role: "assistant", content: raw || "{}" },
        {
          role: "user",
          content: `Your previous reply did not match the required schema. Problems: ${parsed.problem}. Reply again with only the corrected JSON object, no other text.`,
        },
      );
      continue;
    }

    console.error(`[policyscope] model output still invalid after repair: ${parsed.problem}`);
  }

  throw new AnalyzeError(
    502,
    "invalid_output",
    "The analysis came back in an unexpected format. Please try again.",
  );
}

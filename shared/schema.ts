import { z } from "zod";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "./limits.js";

export { MAX_INPUT_CHARS, MIN_INPUT_CHARS };

/**
 * Normalises enum-like strings from the model ("Medium", "corporate policy", " HIGH ")
 * before validating against the allowed values.
 */
function looseEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase().replace(/[\s-]+/g, "_") : v),
    z.enum(values),
  );
}

const text = z.string().trim();
const required = text.min(1);
const level = looseEnum(["high", "medium", "low"]);
const effect = looseEnum(["positive", "negative", "mixed", "neutral"]);

export const DOCUMENT_TYPES = ["bill", "regulation", "corporate_policy", "contract", "other"] as const;

export const DossierSchema = z.object({
  title: required,
  document_type: looseEnum(DOCUMENT_TYPES).catch("other"),
  jurisdiction: text.default("Unspecified").transform((v) => v || "Unspecified"),
  one_sentence_summary: required,
  who_is_affected: z
    .array(z.object({ group: required, effect, explanation: required }))
    .default([]),
  unintended_consequences: z
    .array(
      z.object({
        consequence: required,
        mechanism: required,
        likelihood: level,
        severity: level,
      }),
    )
    .default([]),
  conflicting_incentives: z
    .array(z.object({ tension: required, explanation: required }))
    .default([]),
  drafting_ambiguities: z
    .array(
      z.object({
        quote: required,
        problem: required,
        likely_litigation_risk: level,
      }),
    )
    .default([]),
  precedent: z
    .array(
      z.object({
        similar_policy: required,
        jurisdiction: text.default("Unspecified"),
        // Models sometimes return a number for the year.
        year: z.union([z.string(), z.number()]).transform((v) => String(v).trim()).default(""),
        outcome: required,
        confidence: level,
      }),
    )
    .default([]),
  steelman_for: required,
  steelman_against: required,
  key_definitions: z
    .array(z.object({ term: required, definition_from_text: required }))
    .default([]),
  bottom_line: required,
});

export type Dossier = z.output<typeof DossierSchema>;
export type Level = "high" | "medium" | "low";
export type Effect = "positive" | "negative" | "mixed" | "neutral";
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const AnalyzeRequestSchema = z.object({
  text: z
    .string({ required_error: "Paste some text to analyze." })
    .trim()
    .min(MIN_INPUT_CHARS, `Paste at least ${MIN_INPUT_CHARS} characters so there is something to analyze.`)
    .max(MAX_INPUT_CHARS, `That text is too long. Keep it under ${MAX_INPUT_CHARS.toLocaleString()} characters.`),
});

export type ApiErrorCode =
  | "invalid_input"
  | "method_not_allowed"
  | "rate_limited"
  | "server_misconfigured"
  | "upstream_error"
  | "upstream_overloaded"
  | "upstream_timeout"
  | "output_truncated"
  | "invalid_output"
  | "network_error"
  | "unknown";

export type AnalyzeResponse =
  | {
      ok: true;
      dossier: Dossier;
      meta: { model: string; elapsedMs: number; repaired: boolean };
    }
  | {
      ok: false;
      error: { code: ApiErrorCode; message: string };
    };

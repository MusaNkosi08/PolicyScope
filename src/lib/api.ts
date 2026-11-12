import type { AnalyzeResponse, ApiErrorCode, Dossier } from "../../shared/schema";

export type AnalyzeSuccess = Extract<AnalyzeResponse, { ok: true }>;

export class ClientError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const CLIENT_TIMEOUT_MS = 120_000;

export async function analyzeText(text: string, signal: AbortSignal): Promise<AnalyzeSuccess> {
  const timeout = AbortSignal.timeout(CLIENT_TIMEOUT_MS);
  const combined = AbortSignal.any ? AbortSignal.any([signal, timeout]) : signal;

  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: combined,
    });
  } catch (err) {
    if (signal.aborted) throw err; // user cancelled: let the caller ignore it
    if (timeout.aborted) throw new ClientError("upstream_timeout", "The analysis timed out. Try a shorter excerpt.");
    throw new ClientError("network_error", "Couldn't reach the server. Check your connection and try again.");
  }

  let data: AnalyzeResponse | null = null;
  try {
    data = (await res.json()) as AnalyzeResponse;
  } catch {
    // Non-JSON body (e.g. a platform timeout page).
  }

  if (!data) {
    if (res.status === 504) throw new ClientError("upstream_timeout", "The analysis timed out. Try a shorter excerpt.");
    throw new ClientError("unknown", `The server returned an unexpected response (HTTP ${res.status}).`);
  }
  if (!data.ok) throw new ClientError(data.error.code, data.error.message);
  return data;
}

export function dossierToJson(dossier: Dossier): string {
  return JSON.stringify(dossier, null, 2);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / older browsers.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadJson(dossier: Dossier) {
  const blob = new Blob([dossierToJson(dossier)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const slug =
    dossier.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "dossier";
  const a = document.createElement("a");
  a.href = url;
  a.download = `policyscope-${slug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

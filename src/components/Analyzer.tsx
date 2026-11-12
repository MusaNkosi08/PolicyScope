import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_INPUT_CHARS, MIN_INPUT_CHARS } from "../../shared/limits";
import type { ApiErrorCode } from "../../shared/schema";
import { analyzeText, ClientError, type AnalyzeSuccess } from "../lib/api";
import { SAMPLE_BILL } from "../lib/sample";
import { DossierView } from "./Dossier";
import { Icons, Logo, Reveal } from "./ui";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; code: ApiErrorCode; message: string }
  | { status: "success"; result: AnalyzeSuccess };

export function Analyzer() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_INPUT_CHARS;
  const tooLong = trimmed.length > MAX_INPUT_CHARS;
  const canSubmit = trimmed.length >= MIN_INPUT_CHARS && !tooLong && state.status !== "loading";

  useEffect(() => () => controller.current?.abort(), []);

  const scrollToResult = useCallback(() => {
    requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  }, []);

  const run = useCallback(async () => {
    if (!canSubmit) return;
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setState({ status: "loading" });
    scrollToResult();

    try {
      const result = await analyzeText(trimmed, ac.signal);
      if (ac.signal.aborted) return;
      setState({ status: "success", result });
      scrollToResult();
    } catch (err) {
      if (ac.signal.aborted) return;
      const e = err instanceof ClientError ? err : new ClientError("unknown", "Something went wrong. Please try again.");
      setState({ status: "error", code: e.code, message: e.message });
    }
  }, [canSubmit, trimmed, scrollToResult]);

  const cancel = () => {
    controller.current?.abort();
    setState({ status: "idle" });
  };

  const reset = () => {
    controller.current?.abort();
    setState({ status: "idle" });
    setText("");
    document.getElementById("analyze")?.scrollIntoView({ block: "start" });
    textareaRef.current?.focus({ preventScroll: true });
  };

  return (
    <section id="analyze" className="scroll-mt-20 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal className="card p-5 sm:p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <StepIndicator status={state.status} />
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Step 1</p>
                <label htmlFor="policy-text" className="mt-1 block font-display text-2xl font-semibold">
                  Paste the document
                </label>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setText(SAMPLE_BILL)}
                disabled={state.status === "loading"}
              >
                <Icons.sparkle />
                Try a sample bill
              </button>
            </div>

            <textarea
              id="policy-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void run();
                }
              }}
              disabled={state.status === "loading"}
              placeholder="Paste a bill, regulation, corporate policy, terms of service or contract clause…"
              rows={12}
              spellCheck={false}
              aria-describedby="policy-text-help"
              aria-invalid={tooShort || tooLong}
              className="block w-full resize-y rounded-xl border border-ps-hairline bg-ps-paper/60 p-4 font-mono text-sm leading-relaxed text-ps-ink placeholder:text-ps-muted/70 focus:border-ps-cyan focus:outline-none focus:ring-2 focus:ring-ps-cyan/30 disabled:opacity-60 dark:border-white/10 dark:bg-black/20 dark:text-ps-paper dark:placeholder:text-slate-500"
            />

            <div className="mt-4 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p id="policy-text-help" className="text-sm text-ps-muted dark:text-slate-400" aria-live="polite">
                {tooLong ? (
                  <span className="text-ps-rose">
                    {trimmed.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters. Trim it down a little.
                  </span>
                ) : tooShort ? (
                  <span className="text-ps-amber">Add a bit more text (at least {MIN_INPUT_CHARS} characters).</span>
                ) : (
                  <>
                    {trimmed.length.toLocaleString()} characters
                    <span className="hidden sm:inline"> · Ctrl/⌘ + Enter to analyze</span>
                  </>
                )}
              </p>
              <div className="flex gap-2">
                {state.status === "loading" && (
                  <button type="button" className="btn-ghost" onClick={cancel}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-gradient" disabled={!canSubmit}>
                  {state.status === "loading" ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Analyzing…
                    </>
                  ) : (
                    <>Analyze</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Reveal>

        <div ref={resultRef} className="scroll-mt-24 pt-10" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "idle" && <EmptyState />}
          {state.status === "loading" && <LoadingSkeleton />}
          {state.status === "error" && <ErrorState code={state.code} message={state.message} onRetry={run} canRetry={canSubmit} />}
          {state.status === "success" && <DossierView result={state.result} onReset={reset} />}
        </div>
      </div>
    </section>
  );
}

function StepIndicator({ status }: { status: State["status"] }) {
  const current = status === "success" ? 3 : status === "loading" ? 2 : 1;
  const steps = ["Paste", "Analyze", "Results"];

  return (
    <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Analysis steps">
      {steps.map((label, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;
        return (
          <li key={label} className={`flex items-center gap-2 text-sm font-semibold ${active ? "text-ps-ink dark:text-white" : "text-ps-muted dark:text-slate-500"}`}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                active ? "bg-gradient-to-br from-ps-teal via-ps-cyan to-ps-indigo text-white" : complete ? "bg-ps-teal/15 text-ps-teal" : "bg-slate-100 dark:bg-white/10"
              }`}
              aria-hidden="true"
            >
              {complete ? <Icons.check /> : number}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function EmptyState() {
  return (
    <Reveal className="flex flex-col items-center rounded-2xl border border-dashed border-ps-hairline px-6 py-14 text-center dark:border-white/15">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ps-muted ring-1 ring-ps-hairline dark:bg-white/5 dark:ring-white/10">
        <Icons.doc />
      </div>
      <h3 className="font-display text-xl font-semibold">Your Impact Dossier will appear here</h3>
      <p className="mt-2 max-w-md text-sm text-ps-muted dark:text-slate-400">
        Paste any legal or policy text above, or load the sample bill to see what a dossier looks like. Analysis usually
        takes 20 to 40 seconds.
      </p>
    </Reveal>
  );
}

function LoadingSkeleton() {
  const [step, setStep] = useState(0);
  const steps = [
    "Reading the document",
    "Mapping who is affected",
    "Tracing second-order effects",
    "Checking the wording for gaps",
    "Looking for comparable policies",
    "Writing both steelmen",
  ];

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 5000);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="space-y-4" role="status">
      <div className="flex items-center gap-3 text-sm font-medium text-ps-muted dark:text-slate-400">
        <span className="float inline-block">
          <Logo size={26} />
        </span>
        <span>{steps[step]}…</span>
      </div>
      <div className="card space-y-4 p-6">
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-28 rounded-full" />
        </div>
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-5 w-full" />
        <div className="skeleton h-5 w-5/6" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
          </div>
        ))}
      </div>
      <div className="card space-y-3 p-6">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <span className="sr-only">Analyzing the document. This can take up to a minute.</span>
    </div>
  );
}

const errorTitles: Partial<Record<ApiErrorCode, string>> = {
  invalid_input: "That text couldn't be analyzed",
  rate_limited: "Slow down a little",
  server_misconfigured: "The server isn't set up correctly",
  upstream_overloaded: "The analysis service is busy",
  upstream_timeout: "The analysis timed out",
  output_truncated: "That document is too big for one dossier",
  invalid_output: "The analysis came back garbled",
  network_error: "Connection problem",
};

function ErrorState({
  code,
  message,
  onRetry,
  canRetry,
}: {
  code: ApiErrorCode;
  message: string;
  onRetry: () => void;
  canRetry: boolean;
}) {
  return (
    <div role="alert" className="card border-ps-rose/30 p-6 dark:border-ps-rose/40 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ps-rose/10 text-ps-rose">
          <Icons.alert />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold">{errorTitles[code] ?? "Something went wrong"}</h3>
          <p className="mt-1 text-ps-muted dark:text-slate-400">{message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {code !== "server_misconfigured" && code !== "invalid_input" && (
              <button type="button" className="btn-gradient px-5 py-2.5 text-sm" onClick={onRetry} disabled={!canRetry}>
                <Icons.refresh />
                Try again
              </button>
            )}
            <a href="#analyze" className="btn-ghost">
              Edit the text
            </a>
          </div>
          <p className="mt-4 font-mono text-xs text-ps-muted/80 dark:text-slate-500">Error code: {code}</p>
        </div>
      </div>
    </div>
  );
}

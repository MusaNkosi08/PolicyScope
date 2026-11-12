import { createElement, useId, useState, type ReactNode } from "react";
import { useInView } from "../hooks/motion";
import type { Effect, Level } from "../../shared/schema";

/* ---------------- Logo ---------------- */

export function Logo({ size = 40, className = "", title }: { size?: number; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const grad = `ps-grad-${id}`;
  const stroke = `url(#${grad})`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={grad} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0D9488" />
          <stop offset="0.5" stopColor="#0891B2" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <path d="M32 4 56.25 18v28L32 60 7.75 46V18Z" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" />
      {/* Three concentric aperture arcs, each with a gap rotated to a different angle */}
      <circle cx="32" cy="32" r="17" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="72 34.8" transform="rotate(-40 32 32)" />
      <circle cx="32" cy="32" r="11" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="46 23.1" transform="rotate(80 32 32)" />
      <circle cx="32" cy="32" r="5.5" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="23 11.6" transform="rotate(200 32 32)" />
      <circle cx="32" cy="32" r="2.4" fill={stroke} />
    </svg>
  );
}

/* ---------------- Reveal ---------------- */

type RevealTag = "div" | "section" | "article" | "ul" | "ol" | "dl" | "header" | "footer";

export function Reveal({
  as = "div",
  stagger = false,
  className = "",
  children,
  id,
}: {
  as?: RevealTag;
  stagger?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const { ref, visible } = useInView<HTMLElement>();
  const cls = [stagger ? "stagger" : "reveal", visible ? "is-visible" : "", className].filter(Boolean).join(" ");
  return createElement(as, { ref, className: cls, id }, children);
}

/* ---------------- Badges ---------------- */

export type Tone = "teal" | "amber" | "rose" | "muted" | "indigo";

const toneClasses: Record<Tone, string> = {
  teal: "bg-ps-teal/10 text-teal-700 ring-ps-teal/30 dark:bg-ps-teal/15 dark:text-teal-300",
  amber: "bg-ps-amber/10 text-amber-700 ring-ps-amber/30 dark:bg-ps-amber/15 dark:text-amber-300",
  rose: "bg-ps-rose/10 text-rose-700 ring-ps-rose/30 dark:bg-ps-rose/15 dark:text-rose-300",
  muted: "bg-slate-100 text-slate-600 ring-slate-300/60 dark:bg-white/5 dark:text-slate-300 dark:ring-white/15",
  indigo: "bg-ps-indigo/10 text-indigo-700 ring-ps-indigo/30 dark:bg-ps-indigo/15 dark:text-indigo-300",
};

const dotClasses: Record<Tone, string> = {
  teal: "bg-ps-teal",
  amber: "bg-ps-amber",
  rose: "bg-ps-rose",
  muted: "bg-ps-muted",
  indigo: "bg-ps-indigo",
};

export function Badge({ tone, children, label }: { tone: Tone; children: ReactNode; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} aria-hidden="true" />
      {label && <span className="font-medium opacity-75">{label}</span>}
      {children}
    </span>
  );
}

export const effectTone: Record<Effect, Tone> = {
  positive: "teal",
  mixed: "amber",
  negative: "rose",
  neutral: "muted",
};

/** For risk-like levels (likelihood, severity, litigation risk): high is bad. */
export const riskTone: Record<Level, Tone> = { high: "rose", medium: "amber", low: "teal" };

/** For confidence: high is good. */
export const confidenceTone: Record<Level, Tone> = { high: "teal", medium: "amber", low: "rose" };

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------------- Collapsible section ---------------- */

export function Section({
  title,
  eyebrow,
  count,
  icon,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  id,
  children,
}: {
  title: string;
  eyebrow?: string;
  count?: number;
  icon?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  children: ReactNode;
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const contentId = useId();
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Reveal as="section" id={id} className="card scroll-mt-24 overflow-hidden">
      <h3 className="m-0">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          className="group flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        >
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ps-paper text-ps-cyan ring-1 ring-ps-hairline dark:bg-white/5 dark:text-cyan-300 dark:ring-white/10">
              {icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            {eyebrow && <span className="eyebrow block">{eyebrow}</span>}
            <span className="flex items-center gap-2 font-display text-lg font-semibold sm:text-xl">
              {title}
              {typeof count === "number" && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-sans text-xs font-semibold text-ps-muted dark:bg-white/10 dark:text-slate-300">
                  {count}
                </span>
              )}
            </span>
          </span>
          <svg
            className={`h-5 w-5 shrink-0 text-ps-muted transition-transform duration-300 group-hover:text-ps-cyan ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </h3>
      <div className="collapse-grid" data-open={open} id={contentId} role="region" aria-label={title} inert={!open ? true : undefined}>
        <div>
          <div className="border-t border-ps-hairline px-5 pb-6 pt-5 dark:border-white/10 sm:px-6">{children}</div>
        </div>
      </div>
    </Reveal>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm italic text-ps-muted dark:text-slate-400">{children}</p>;
}

/* ---------------- Icons (inline, stroke-based) ---------------- */

function Icon({ d, className = "h-5 w-5" }: { d: string | string[]; className?: string }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

export const Icons = {
  users: () => <Icon d={["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"]} />,
  alert: () => <Icon d={["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z", "M12 9v4", "M12 17h.01"]} />,
  scale: () => <Icon d={["M12 3v18", "M5 21h14", "M3 7h18", "m6 7-3 7a3 3 0 0 0 6 0Z", "m18 7-3 7a3 3 0 0 0 6 0Z"]} />,
  quote: () => <Icon d={["M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 4-2 6-4 6", "M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 4-2 6-4 6"]} />,
  history: () => <Icon d={["M3 12a9 9 0 1 0 3-6.7L3 8", "M3 3v5h5", "M12 7v5l4 2"]} />,
  swords: () => <Icon d={["M14.5 17.5 3 6V3h3l11.5 11.5", "m13 19 6-6", "m16 16 4 4", "m19 21 2-2", "M9.5 6.5 14 2h3v3l-4.5 4.5"]} />,
  book: () => <Icon d={["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"]} />,
  target: () => <Icon d={["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"]} />,
  copy: () => <Icon className="h-4 w-4" d={["M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"]} />,
  check: () => <Icon className="h-4 w-4" d="M20 6 9 17l-5-5" />,
  download: () => <Icon className="h-4 w-4" d={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"]} />,
  share: () => <Icon className="h-4 w-4" d={["M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "m8.59 13.51 6.83 3.98", "m15.41 6.51-6.82 3.98"]} />,
  refresh: () => <Icon className="h-4 w-4" d={["M3 12a9 9 0 0 1 15-6.7L21 8", "M21 3v5h-5", "M21 12a9 9 0 0 1-15 6.7L3 16", "M3 21v-5h5"]} />,
  sun: () => <Icon d={["M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z", "M12 1v2", "M12 21v2", "m4.22 4.22 1.42 1.42", "m18.36 18.36 1.42 1.42", "M1 12h2", "M21 12h2", "m4.22 19.78 1.42-1.42", "m18.36 5.64 1.42-1.42"]} />,
  moon: () => <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />,
  arrowDown: () => <Icon className="h-4 w-4" d={["M12 5v14", "m19 12-7 7-7-7"]} />,
  sparkle: () => <Icon className="h-4 w-4" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />,
  doc: () => <Icon className="h-8 w-8" d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"]} />,
  thumbsUp: () => <Icon d={["M7 10v12", "M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"]} />,
  thumbsDown: () => <Icon d={["M17 14V2", "M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"]} />,
};

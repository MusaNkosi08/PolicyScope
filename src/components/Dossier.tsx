import { useEffect, useState, type ReactNode } from "react";
import type { DocumentType, Dossier } from "../../shared/schema";
import { copyText, dossierToJson, downloadJson, type AnalyzeSuccess } from "../lib/api";
import {
  Badge,
  capitalize,
  confidenceTone,
  EmptyNote,
  effectTone,
  Icons,
  Reveal,
  riskTone,
  Section,
  type Tone,
} from "./ui";

const docTypeLabel: Record<DocumentType, string> = {
  bill: "Bill",
  regulation: "Regulation",
  corporate_policy: "Corporate policy",
  contract: "Contract",
  other: "Document",
};

export function DossierView({ result, onReset }: { result: AnalyzeSuccess; onReset: () => void }) {
  const d = result.dossier;
  const sectionDefaults = {
    affected: true,
    consequences: true,
    incentives: true,
    ambiguities: true,
    precedent: true,
    steelman: true,
    definitions: d.key_definitions.length <= 6,
    verdict: true,
  };
  const [openSections, setOpenSections] = useState(sectionDefaults);
  const [activeSection, setActiveSection] = useState("affected");

  useEffect(() => {
    const sections = Object.keys(sectionDefaults)
      .map((id) => document.getElementById(`dossier-${id}`))
      .filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id.replace("dossier-", ""));
      },
      { rootMargin: "-18% 0px -65% 0px", threshold: [0.1, 0.4, 0.8] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [d.key_definitions.length]);

  const setSectionOpen = (id: keyof typeof sectionDefaults, open: boolean) => {
    setOpenSections((current) => ({ ...current, [id]: open }));
  };

  const jumpTo = (id: keyof typeof sectionDefaults) => {
    setSectionOpen(id, true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`dossier-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const allOpen = Object.values(openSections).every(Boolean);

  return (
    <article className="space-y-5" aria-label={`Impact Dossier: ${d.title}`}>
      <SummaryCard dossier={d} meta={result.meta} onReset={onReset} />
      <div className="sticky top-20 z-20 flex items-center gap-2 rounded-xl border border-ps-hairline bg-ps-paper/95 p-2 backdrop-blur dark:border-white/10 dark:bg-ps-ink/95">
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto" aria-label="Jump to dossier section">
          {Object.entries({
            affected: "Affected",
            consequences: "Consequences",
            incentives: "Incentives",
            ambiguities: "Ambiguities",
            precedent: "Precedent",
            steelman: "Steelman",
            definitions: "Definitions",
            verdict: "Verdict",
          }).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => jumpTo(id as keyof typeof sectionDefaults)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ps-cyan ${
                activeSection === id ? "bg-ps-ink text-white dark:bg-white dark:text-ps-ink" : "text-ps-muted hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              }`}
              aria-current={activeSection === id ? "true" : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setOpenSections(Object.fromEntries(Object.keys(sectionDefaults).map((id) => [id, !allOpen])) as typeof sectionDefaults)}
          className="hidden shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-ps-cyan hover:bg-ps-cyan/10 focus:outline-none focus:ring-2 focus:ring-ps-cyan sm:block"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <AffectedSection dossier={d} open={openSections.affected} onOpenChange={(open) => setSectionOpen("affected", open)} />
      <ConsequencesSection dossier={d} open={openSections.consequences} onOpenChange={(open) => setSectionOpen("consequences", open)} />
      <IncentivesSection dossier={d} open={openSections.incentives} onOpenChange={(open) => setSectionOpen("incentives", open)} />
      <AmbiguitiesSection dossier={d} open={openSections.ambiguities} onOpenChange={(open) => setSectionOpen("ambiguities", open)} />
      <PrecedentSection dossier={d} open={openSections.precedent} onOpenChange={(open) => setSectionOpen("precedent", open)} />
      <SteelmanSection dossier={d} open={openSections.steelman} onOpenChange={(open) => setSectionOpen("steelman", open)} />
      <DefinitionsSection dossier={d} open={openSections.definitions} onOpenChange={(open) => setSectionOpen("definitions", open)} />
      <BottomLine dossier={d} />
    </article>
  );
}

/* ---------------- Summary + actions ---------------- */

function SummaryCard({
  dossier: d,
  meta,
  onReset,
}: {
  dossier: Dossier;
  meta: AnalyzeSuccess["meta"];
  onReset: () => void;
}) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (copied === "idle") return;
    const t = setTimeout(() => setCopied("idle"), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const onCopy = async () => setCopied((await copyText(dossierToJson(d))) ? "copied" : "failed");

  const onShare = async () => {
    try {
      await navigator.share({
        title: `PolicyScope: ${d.title}`,
        text: `${d.one_sentence_summary}\n\nBottom line: ${d.bottom_line}`,
      });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const negatives = d.who_is_affected.filter((g) => g.effect === "negative").length;
  const positives = d.who_is_affected.filter((g) => g.effect === "positive").length;
  const highRisk = d.drafting_ambiguities.filter((a) => a.likely_litigation_risk === "high").length;

  return (
    <Reveal className="card gradient-border overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{docTypeLabel[d.document_type]}</Badge>
        <Badge tone="muted">{d.jurisdiction}</Badge>
      </div>
      <h2 className="mt-4 text-balance font-display text-2xl font-bold sm:text-3xl">{d.title}</h2>
      <p className="eyebrow mt-6">In one sentence</p>
      <p className="mt-2 text-pretty text-lg leading-relaxed sm:text-xl">{d.one_sentence_summary}</p>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-ps-hairline pt-5 dark:border-white/10">
        <Stat label="Groups helped" value={positives} tone="text-ps-teal" />
        <Stat label="Groups harmed" value={negatives} tone="text-ps-rose" />
        <Stat label="High litigation risks" value={highRisk} tone="text-ps-amber" />
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost" onClick={onCopy} aria-live="polite">
          {copied === "copied" ? <Icons.check /> : <Icons.copy />}
          {copied === "copied" ? "Copied!" : copied === "failed" ? "Copy failed" : "Copy JSON"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => downloadJson(d)}>
          <Icons.download />
          Download JSON
        </button>
        {canShare && (
          <button type="button" className="btn-ghost" onClick={onShare}>
            <Icons.share />
            Share
          </button>
        )}
        <button type="button" className="btn-ghost sm:ml-auto" onClick={onReset}>
          <Icons.refresh />
          New analysis
        </button>
      </div>
      <p className="mt-4 text-xs text-ps-muted dark:text-slate-500">
        Generated by {meta.model} in {(meta.elapsedMs / 1000).toFixed(1)}s. AI analysis can be wrong: check quotes and
        precedent against the source.
      </p>
    </Reveal>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <dt className="text-xs text-ps-muted dark:text-slate-400">{label}</dt>
      <dd className={`font-display text-2xl font-bold sm:text-3xl ${tone}`}>{value}</dd>
    </div>
  );
}

/* ---------------- Sections ---------------- */

type SectionControl = { open: boolean; onOpenChange: (open: boolean) => void };

const effectOrder = { negative: 0, mixed: 1, positive: 2, neutral: 3 } as const;

function AffectedSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  const groups = [...d.who_is_affected].sort((a, b) => effectOrder[a.effect] - effectOrder[b.effect]);
  return (
    <Section id="dossier-affected" open={open} onOpenChange={onOpenChange} title="Who's affected" eyebrow="Stakeholders" count={groups.length} icon={<Icons.users />}>
      {groups.length === 0 ? (
        <EmptyNote>No specific affected groups identified.</EmptyNote>
      ) : (
        <Reveal stagger as="ul" className="grid gap-3 sm:grid-cols-2">
          {groups.map((g, i) => (
            <li key={`${g.group}-${i}`} className="rounded-xl border border-ps-hairline p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-display font-semibold">{g.group}</h4>
                <Badge tone={effectTone[g.effect]}>{capitalize(g.effect)}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ps-muted dark:text-slate-400">{g.explanation}</p>
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

const levelRank = { high: 0, medium: 1, low: 2 } as const;

function ConsequencesSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  const items = [...d.unintended_consequences].sort(
    (a, b) => levelRank[a.severity] + levelRank[a.likelihood] - (levelRank[b.severity] + levelRank[b.likelihood]),
  );
  return (
    <Section id="dossier-consequences" open={open} onOpenChange={onOpenChange} title="Unintended consequences" eyebrow="Second-order effects" count={items.length} icon={<Icons.alert />}>
      {items.length === 0 ? (
        <EmptyNote>No likely unintended consequences identified.</EmptyNote>
      ) : (
        <Reveal stagger as="ul" className="space-y-3">
          {items.map((c, i) => (
            <li key={i} className="rounded-xl border border-ps-hairline p-4 dark:border-white/10">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h4 className="font-display font-semibold">{c.consequence}</h4>
                <div className="flex shrink-0 gap-1.5">
                  <Badge tone={riskTone[c.likelihood]} label="Likelihood">
                    {capitalize(c.likelihood)}
                  </Badge>
                  <Badge tone={riskTone[c.severity]} label="Severity">
                    {capitalize(c.severity)}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ps-muted dark:text-slate-400">
                <span className="font-semibold text-ps-ink dark:text-slate-200">How: </span>
                {c.mechanism}
              </p>
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

function IncentivesSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  return (
    <Section id="dossier-incentives" open={open} onOpenChange={onOpenChange} title="Conflicting incentives" eyebrow="Tensions" count={d.conflicting_incentives.length} icon={<Icons.scale />}>
      {d.conflicting_incentives.length === 0 ? (
        <EmptyNote>No significant conflicting incentives identified.</EmptyNote>
      ) : (
        <Reveal stagger as="ul" className="grid gap-3 sm:grid-cols-2">
          {d.conflicting_incentives.map((t, i) => (
            <li key={i} className="rounded-xl border-l-4 border-ps-amber bg-ps-amber/5 p-4 dark:bg-ps-amber/10">
              <h4 className="font-display font-semibold">{t.tension}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-ps-muted dark:text-slate-400">{t.explanation}</p>
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

function AmbiguitiesSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  const items = [...d.drafting_ambiguities].sort(
    (a, b) => levelRank[a.likely_litigation_risk] - levelRank[b.likely_litigation_risk],
  );
  return (
    <Section id="dossier-ambiguities" open={open} onOpenChange={onOpenChange} title="Drafting ambiguities" eyebrow="Wording that invites disputes" count={items.length} icon={<Icons.quote />}>
      {items.length === 0 ? (
        <EmptyNote>No notable drafting ambiguities identified.</EmptyNote>
      ) : (
        <Reveal stagger as="ul" className="space-y-4">
          {items.map((a, i) => (
            <li key={i} className="rounded-xl border border-ps-hairline p-4 dark:border-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <blockquote className="border-l-2 border-ps-cyan pl-3 font-mono text-sm leading-relaxed text-ps-ink dark:text-slate-200">
                  “{a.quote}”
                </blockquote>
                <span className="shrink-0">
                  <Badge tone={riskTone[a.likely_litigation_risk]} label="Litigation risk">
                    {capitalize(a.likely_litigation_risk)}
                  </Badge>
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ps-muted dark:text-slate-400">{a.problem}</p>
            </li>
          ))}
        </Reveal>
      )}
    </Section>
  );
}

function PrecedentSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  const items = [...d.precedent].sort((a, b) => levelRank[a.confidence] - levelRank[b.confidence]);
  return (
    <Section id="dossier-precedent" open={open} onOpenChange={onOpenChange} title="Precedent" eyebrow="Comparable policies" count={items.length} icon={<Icons.history />}>
      {items.length === 0 ? (
        <EmptyNote>No precedent cited. The model returns none rather than inventing examples it isn't sure about.</EmptyNote>
      ) : (
        <>
          <Reveal stagger as="ul" className="grid gap-3 sm:grid-cols-2">
            {items.map((p, i) => (
              <li key={i} className="rounded-xl border border-ps-hairline p-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display font-semibold">{p.similar_policy}</h4>
                  <Badge tone={confidenceTone[p.confidence]} label="Confidence">
                    {capitalize(p.confidence)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs font-medium text-ps-muted dark:text-slate-500">
                  {[p.jurisdiction, p.year].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ps-muted dark:text-slate-400">{p.outcome}</p>
              </li>
            ))}
          </Reveal>
          <p className="mt-4 text-xs text-ps-muted dark:text-slate-500">
            Verify each example against primary sources before relying on it, especially low-confidence ones.
          </p>
        </>
      )}
    </Section>
  );
}

function SteelmanSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  return (
    <Section id="dossier-steelman" open={open} onOpenChange={onOpenChange} title="Steelman for and against" eyebrow="The strongest honest case on each side" icon={<Icons.swords />}>
      <Reveal stagger className="grid gap-4 md:grid-cols-2">
        <SteelmanCard heading="For" tone="teal" icon={<Icons.thumbsUp />} body={d.steelman_for} />
        <SteelmanCard heading="Against" tone="rose" icon={<Icons.thumbsDown />} body={d.steelman_against} />
      </Reveal>
    </Section>
  );
}

function SteelmanCard({ heading, tone, icon, body }: { heading: string; tone: Tone; icon: ReactNode; body: string }) {
  const color = tone === "teal" ? "#0D9488" : "#E11D48";
  return (
    <div className="rounded-xl border border-t-4 border-ps-hairline p-5 dark:border-white/10" style={{ borderTopColor: color }}>
      <div className="flex items-center gap-2 font-display font-semibold" style={{ color }}>
        {icon}
        <h4>{heading}</h4>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-ps-ink dark:text-slate-200">{body}</p>
    </div>
  );
}

function DefinitionsSection({ dossier: d, open, onOpenChange }: { dossier: Dossier } & SectionControl) {
  return (
    <Section
      title="Key definitions"
      id="dossier-definitions"
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="As written in the text"
      count={d.key_definitions.length}
      icon={<Icons.book />}
      defaultOpen={d.key_definitions.length <= 6}
    >
      {d.key_definitions.length === 0 ? (
        <EmptyNote>The text doesn't define any key terms.</EmptyNote>
      ) : (
        <dl className="divide-y divide-ps-hairline dark:divide-white/10">
          {d.key_definitions.map((k, i) => (
            <div key={i} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6">
              <dt className="font-display font-semibold">{k.term}</dt>
              <dd className="text-sm leading-relaxed text-ps-muted dark:text-slate-400">{k.definition_from_text}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}

function BottomLine({ dossier: d }: { dossier: Dossier }) {
  return (
    <Reveal as="section" id="dossier-verdict" className="relative scroll-mt-24 overflow-hidden rounded-2xl bg-ps-ink p-6 text-ps-paper sm:p-8 dark:bg-black/40 dark:ring-1 dark:ring-white/10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-ps-gradient" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-ps-indigo/30 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300 sm:flex">
          <Icons.target />
        </span>
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bottom line</p>
          <p className="mt-2 text-pretty text-lg leading-relaxed sm:text-xl">{d.bottom_line}</p>
        </div>
      </div>
    </Reveal>
  );
}

import { Icons, Logo, Reveal } from "./ui";

const sections = [
  { title: "Who's affected", body: "Every group the text touches, tagged positive, mixed, negative or neutral.", tone: "bg-ps-teal" },
  { title: "Unintended consequences", body: "Second-order effects with the mechanism behind them, rated by likelihood and severity.", tone: "bg-ps-rose" },
  { title: "Conflicting incentives", body: "Where the policy pulls actors in opposite directions.", tone: "bg-ps-amber" },
  { title: "Drafting ambiguities", body: "Exact quoted phrases that invite disputes, with a litigation-risk rating.", tone: "bg-ps-rose" },
  { title: "Precedent", body: "Comparable policies elsewhere, each with a confidence badge so you know what to double-check.", tone: "bg-ps-cyan" },
  { title: "Steelman for & against", body: "The strongest honest case on each side, side by side.", tone: "bg-ps-indigo" },
  { title: "Key definitions", body: "The terms that decide how the text actually applies, quoted from the source.", tone: "bg-ps-teal" },
  { title: "Bottom line", body: "A short, non-partisan verdict on what the document really does.", tone: "bg-ps-amber" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Decorative parallax glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div data-speed="0.25" className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-ps-teal/20 blur-3xl dark:bg-ps-teal/25" />
        <div data-speed="-0.15" className="absolute -right-24 top-32 h-96 w-96 rounded-full bg-ps-indigo/20 blur-3xl dark:bg-ps-indigo/25" />
        <div data-speed="0.4" className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-ps-cyan/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.35) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
        <div data-speed="0.12">
          <div className="float">
            <div className="rounded-3xl bg-white/70 p-4 shadow-[0_20px_50px_-20px_rgba(8,145,178,0.5)] ring-1 ring-ps-hairline backdrop-blur dark:bg-white/5 dark:ring-white/10">
              <Logo size={72} title="PolicyScope logo" />
            </div>
          </div>
        </div>

        <Reveal className="mt-10">
          <p className="eyebrow mb-4">Legislative impact simulator</p>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
            See what a bill <span className="text-gradient">actually does.</span>
          </h1>
        </Reveal>

        <Reveal className="mt-6">
          <p className="mx-auto max-w-2xl text-pretty text-lg text-ps-muted dark:text-slate-400 sm:text-xl">
            Paste a bill, regulation, corporate policy or contract. PolicyScope returns a non-partisan Impact Dossier: who
            wins, who loses, what could go wrong, and where the wording will end up in court.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <a href="#analyze" className="btn-gradient px-8 py-4 text-lg">
            Analyze a document
            <Icons.arrowDown />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      <div aria-hidden="true" data-speed="0.2" className="pointer-events-none absolute right-0 top-1/4 h-72 w-72 rounded-full bg-ps-teal/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">The Impact Dossier</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Eight lenses on one document</h2>
          <p className="mt-4 text-ps-muted dark:text-slate-400">
            Every claim is grounded in the text you paste. Where the text is unclear, the dossier says so instead of
            guessing.
          </p>
        </Reveal>

        <Reveal stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((s) => (
            <div key={s.title} className="card p-5">
              <span className={`mb-4 block h-1.5 w-10 rounded-full ${s.tone}`} aria-hidden="true" />
              <h3 className="font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ps-muted dark:text-slate-400">{s.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

import { useScrollProgress } from "../hooks/motion";
import { useTheme } from "../hooks/useTheme";
import { Icons, Logo } from "./ui";

export function ScrollProgress() {
  const progress = useScrollProgress();
  return (
    <div
      className="scroll-progress"
      style={{ width: `${(progress * 100).toFixed(2)}%` }}
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    />
  );
}

export function Header() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-50 border-b border-ps-hairline/70 bg-ps-paper/75 backdrop-blur-md dark:border-white/10 dark:bg-ps-ink/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 rounded-lg font-display text-lg font-semibold">
          <Logo size={30} />
          <span>
            Policy<span className="text-gradient">Scope</span>
          </span>
        </a>
        <nav className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ps-muted transition-colors hover:bg-slate-100 hover:text-ps-ink dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Icons.sun /> : <Icons.moon />}
          </button>
          <a href="#analyze" className="btn-gradient px-4 py-2 text-sm">
            Analyze
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ps-hairline py-10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ps-muted dark:text-slate-400 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-display font-semibold text-ps-ink dark:text-ps-paper">PolicyScope</span>
        </div>
        <p className="text-center sm:text-right">
          AI-generated analysis. Not legal advice. Verify precedent and quotes against primary sources.
        </p>
      </div>
    </footer>
  );
}

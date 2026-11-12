import { Analyzer } from "./components/Analyzer";
import { Footer, Header, ScrollProgress } from "./components/Chrome";
import { Hero, HowItWorks } from "./components/Hero";
import { useParallax } from "./hooks/motion";

export default function App() {
  useParallax();

  return (
    <>
      <a
        href="#analyze"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ps-ink"
      >
        Skip to the analyzer
      </a>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Analyzer />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}

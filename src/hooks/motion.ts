import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function getReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_QUERY).matches;
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Live `prefers-reduced-motion: reduce` value. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

/**
 * Becomes true the first time the element enters the viewport, then stops observing.
 * Under reduced motion (or without IntersectionObserver) it is visible immediately.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (getReducedMotion() || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return { ref, visible };
}

/** rAF-throttled scroll position as a 0..1 ratio of the scrollable height. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Content height changes (e.g. a dossier appearing) also change progress.
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

/**
 * Parallax for every element with a `data-speed` attribute.
 * Offset is based on the distance between the element's parent centre and the viewport
 * centre, so positive speeds lag behind the scroll and negative speeds lead it.
 * The parent is measured (not the element) so the applied transform never feeds back.
 */
export function useParallax() {
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_QUERY);
    let frame = 0;

    const reset = () => {
      document.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
        el.style.transform = "";
      });
    };

    const update = () => {
      frame = 0;
      if (mq.matches) return;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = Number.parseFloat(el.dataset.speed ?? "0");
        if (!speed) return;
        const host = el.parentElement ?? el;
        const rect = host.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) return; // far off-screen
        const offset = (vh / 2 - (rect.top + rect.height / 2)) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onMotionChange = () => (mq.matches ? reset() : onScroll());

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onMotionChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMotionChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}

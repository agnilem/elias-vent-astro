import Lenis from "lenis";
import { reducedMotion } from "./lib";

// lenis smooth scrolling (lerp 0.1), exposed on window for programmatic scrolls.
// Skipped entirely when the visitor prefers reduced motion.
if (!reducedMotion()) {
  const lenis = new Lenis({ lerp: 0.1 });
  window.__lenis = lenis;
  const loop = (t: number) => {
    lenis.raf(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

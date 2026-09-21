import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Smooth scroll to an absolute page offset (lenis-aware). */
export function scrollToY(y: number) {
  const l = window.__lenis;
  if (l) l.scrollTo(y);
  else window.scrollTo({ top: y, behavior: reducedMotion() ? "auto" : "smooth" });
}

/** rAF-throttled scroll + resize listener. Runs once immediately. */
export function onScrollFrame(update: () => void) {
  let raf = 0;
  const run = () => {
    raf = 0;
    update();
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(run);
  };
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
}

/**
 * Minimal physical spring (stiffness / damping / mass), the same model
 * framer-motion's useSpring uses. Call step(dt) each frame.
 */
export class Spring {
  x: number;
  v = 0;
  target: number;
  constructor(value: number, private k: number, private c: number, private m: number) {
    this.x = value;
    this.target = value;
  }
  set(t: number) {
    this.target = t;
  }
  jump(t: number) {
    this.x = this.target = t;
    this.v = 0;
  }
  step(dt: number) {
    let rem = Math.min(dt, 0.064);
    while (rem > 0) {
      const h = Math.min(rem, 1 / 240);
      const f = -this.k * (this.x - this.target) - this.c * this.v;
      this.v += (f / this.m) * h;
      this.x += this.v * h;
      rem -= h;
    }
    if (Math.abs(this.v) < 1e-4 && Math.abs(this.x - this.target) < 1e-4) {
      this.x = this.target;
      this.v = 0;
    }
    return this.x;
  }
  get settled() {
    return this.v === 0 && this.x === this.target;
  }
}

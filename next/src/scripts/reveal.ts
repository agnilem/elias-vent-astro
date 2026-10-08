import { onScrollFrame, reducedMotion } from "./lib";

const EASE = (p: number) => 1 - Math.pow(1 - p, 3);
// C2-continuous smootherstep: eases in and out so a scrubbed reveal has no abrupt onset.
const SMOOTH = (p: number) => p * p * p * (p * (p * 6 - 15) + 10);

/**
 * ScrollWords: each word span (.sw) reveals (opacity 0->1, blur 26px->0) by its
 * own viewport position between 95% and 52% of the viewport height.
 * ScrollFade: blocks (.sf) fade in, un-blur from 14px and drift up 14px between
 * 102% and 42% of the viewport height (smootherstep). Both reverse on scroll up.
 */
const words = Array.from(document.querySelectorAll<HTMLElement>(".sw"));
const blocks = Array.from(document.querySelectorAll<HTMLElement>(".sf"));

if (!reducedMotion() && (words.length || blocks.length)) {
  onScrollFrame(() => {
    const vh = window.innerHeight || 1;
    const ws = vh * 0.95;
    const we = vh * 0.52;
    for (const s of words) {
      const r = s.getBoundingClientRect();
      const e = EASE(Math.max(0, Math.min(1, (ws - r.top) / (ws - we))));
      s.style.opacity = String(e);
      s.style.filter = e < 0.999 ? "blur(" + ((1 - e) * 26).toFixed(2) + "px)" : "none";
    }
    const bs = vh * 1.02;
    const be = vh * 0.42;
    for (const el of blocks) {
      const r = el.getBoundingClientRect();
      const e = SMOOTH(Math.max(0, Math.min(1, (bs - r.top) / (bs - be))));
      el.style.opacity = e.toFixed(3);
      el.style.transform = e < 0.999 ? "translate3d(0," + ((1 - e) * 14).toFixed(2) + "px,0)" : "none";
      el.style.filter = e < 0.999 ? "blur(" + ((1 - e) * 14).toFixed(2) + "px)" : "none";
    }
  });
}

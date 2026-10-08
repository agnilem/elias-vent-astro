// Behaviour for About.astro (moved out of the component so the Astro and Next builds share it).
import { onScrollFrame, reducedMotion } from "../lib";

// Scroll parallax for the full-bleed portrait (port of ImageParallax.tsx): the
// media block is taller than its stage, so it drifts against the scroll (up to
// 210px, capped by the real overhang) while zooming in up to 24%.
const el = document.querySelector<HTMLElement>("[data-parallax]");
if (el && !reducedMotion()) {
  const host = el.parentElement!;
  onScrollFrame(() => {
    const r = host.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const child = el.firstElementChild as HTMLElement | null;
    const slack = child ? Math.max(0, (child.offsetHeight - r.height) / 2) : 0;
    const shift = Math.min(210, slack * 0.9);
    const c = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
    const q = Math.max(0, Math.min(1, (vh - r.top) / vh));
    el.style.transform = "translate3d(0," + (c * shift).toFixed(2) + "px,0) scale(" + (1 + 0.24 * q).toFixed(4) + ")";
  });
}

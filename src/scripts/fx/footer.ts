// Behaviour for Footer.astro (moved out of the component so the Astro and Next builds share it).
import { initShader } from "../shader";
import { whenNear } from "../lib";
// The shader compiles when the footer is two screens away, not at page load.
document.querySelectorAll<HTMLCanvasElement>("[data-shader]").forEach((el) => whenNear(el, () => initShader(el)));

// Framer "auto-fit" text: the wordmark is sized to span the container width.
document.querySelectorAll<HTMLElement>("[data-fit]").forEach((box) => {
  const probe = box.querySelector<HTMLElement>("[data-probe]")!;
  const fit = () => {
    const w = probe.getBoundingClientRect().width;
    if (w > 0) box.style.fontSize = `${(box.clientWidth / w) * 100}px`;
  };
  fit();
  new ResizeObserver(fit).observe(box);
  document.fonts?.ready.then(fit);
});

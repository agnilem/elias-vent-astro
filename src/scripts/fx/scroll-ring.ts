// Behaviour for ScrollRing.astro (moved out of the component so the Astro and Next builds share it).
import { reducedMotion } from "../lib";

document.querySelectorAll<HTMLElement>("[data-ring]").forEach((root) => {
  const wheel = root.querySelector<HTMLElement>("[data-wheel]")!;
  const radius = Number(root.dataset.radius);
  const speed = Number(root.dataset.speed);
  const calm = reducedMotion();
  const spin = calm ? 0 : Number(root.dataset.spin);

  // Fit the radius to the box so it never blows out on small screens.
  const measure = () => {
    const box = root.getBoundingClientRect();
    const imageWidth = parseFloat(getComputedStyle(root).getPropertyValue("--rw")) || 122;
    const max = Math.min(box.width, box.height) / 2 - imageWidth * 0.18;
    wheel.style.setProperty("--r", String(Math.max(110, Math.min(radius, max))));
  };
  measure();
  new ResizeObserver(measure).observe(root);
  if (calm) return;

  let target = 0;
  let current = 0;
  window.addEventListener("wheel", (e) => (target += e.deltaY * speed), { passive: true });
  let lastTouch: number | null = null;
  window.addEventListener("touchstart", (e) => (lastTouch = e.touches[0]?.clientY ?? null), { passive: true });
  window.addEventListener(
    "touchmove",
    (e) => {
      const y = e.touches[0]?.clientY;
      if (y == null || lastTouch == null) return;
      target += (lastTouch - y) * speed * 1.6;
      lastTouch = y;
    },
    { passive: true }
  );
  let last = 0;
  const tick = (t: number) => {
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 1 / 60;
    last = t;
    target += spin * dt;
    current += (target - current) * 0.08;
    wheel.style.transform = `translate(-50%, -50%) rotate(${current}deg)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

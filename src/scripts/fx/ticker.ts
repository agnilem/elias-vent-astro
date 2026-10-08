// Behaviour for Ticker.astro (moved out of the component so the Astro and Next builds share it).
// Framer Ticker effect: 50 px/s to the left, 10px gap, text at 20% opacity.
document.querySelectorAll<HTMLElement>("[data-ticker]").forEach((el) => {
  const measure = () => (el.style.animationDuration = `${el.scrollWidth / 2 / 50}s`);
  measure();
  new ResizeObserver(measure).observe(el);
});

export {};

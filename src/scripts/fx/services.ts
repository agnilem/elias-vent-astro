// Behaviour for Services.astro (moved out of the component so the Astro and Next builds share it).
import { onScrollFrame, scrollToY } from "../lib";

// Services switcher: the tall wrapper pins a 100vh stage; scroll progress
// selects the service (index = floor(p * n * 0.999)). Clicking a name
// smooth-scrolls to that service's slice, so scroll stays the source of truth.
const el = document.querySelector<HTMLElement>("[data-services]");
if (el) {
  const captions: string[][] = JSON.parse(el.dataset.captions || "[]");
  const n = captions.length;
  const names = Array.from(el.querySelectorAll<HTMLElement>("[data-name]"));
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>(".services-image img"));
  const caps = el.querySelector<HTMLElement>("[data-caps]")!;
  const fill = el.querySelector<HTMLElement>("[data-fill]")!;
  const counter = el.querySelector<HTMLElement>("[data-counter]")!;
  let idx = 0;
  const apply = (i: number) => {
    if (i === idx) return;
    idx = i;
    names.forEach((nm, k) => (nm.style.color = k === i ? "var(--white)" : "var(--white-60)"));
    imgs.forEach((im, k) => im.classList.toggle("is-on", k === i));
    caps.replaceChildren(
      ...captions[i].map((c) => {
        const p = document.createElement("p");
        p.className = "body";
        p.textContent = c;
        return p;
      })
    );
    caps.classList.remove("is-in");
    void caps.offsetWidth;
    caps.classList.add("is-in");
    fill.style.width = `${((i + 1) / n) * 100}%`;
    counter.textContent = String(i + 1).padStart(2, "0");
  };
  onScrollFrame(() => {
    const rect = el.getBoundingClientRect();
    const total = Math.max(el.offsetHeight - window.innerHeight, 1);
    const p = Math.min(Math.max(-rect.top, 0), total) / total;
    apply(Math.max(0, Math.min(n - 1, Math.floor(p * n * 0.999))));
  });
  names.forEach((nm, i) =>
    nm.addEventListener("click", () => {
      const rect = el.getBoundingClientRect();
      const total = Math.max(el.offsetHeight - window.innerHeight, 1);
      scrollToY(window.scrollY + rect.top + ((i + 0.5) / n) * total);
    })
  );
}

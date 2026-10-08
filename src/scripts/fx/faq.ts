// Behaviour for FAQ.astro (moved out of the component so the Astro and Next builds share it).
// FAQ accordion (Framer FAQ Item Closed/Open variants): one open at a time,
document.querySelectorAll<HTMLElement>("[data-faq]").forEach((root) => {
  const items = Array.from(root.querySelectorAll<HTMLButtonElement>(".faq-item"));
  // Framer animates the variant change as a layout animation: the rows below
  // jump to their new place at once, while the item's own box grows or shrinks
  // over 0.3s. A clip-path on the item reproduces that box.
  const EASE = "cubic-bezier(0.44, 0, 0.56, 1)";
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setOpen = (item: HTMLButtonElement, open: boolean) => {
    const wrap = item.querySelector<HTMLElement>(".faq-answer-wrap")!;
    item.classList.toggle("is-open", open);
    item.setAttribute("aria-expanded", String(open));
    wrap.setAttribute("aria-hidden", String(!open));
    item.getAnimations().forEach((an) => an.cancel());
    item.style.marginBottom = "";
    const from = item.getBoundingClientRect().height;
    wrap.style.height = open ? "auto" : "20px";
    const to = item.getBoundingClientRect().height;
    const d = Math.abs(to - from);
    if (calm || !d) return;
    if (open) {
      item.animate({ clipPath: [`inset(0 0 ${d}px 0 round 8px)`, "inset(0 0 0px 0 round 8px)"] }, { duration: 300, easing: EASE });
    } else {
      wrap.style.height = "auto";
      item.style.marginBottom = `-${d}px`;
      const an = item.animate({ clipPath: ["inset(0 0 0px 0 round 8px)", `inset(0 0 ${d}px 0 round 8px)`] }, { duration: 300, easing: EASE });
      an.onfinish = () => { wrap.style.height = "20px"; item.style.marginBottom = ""; };
    }
  };
  items.forEach((item) =>
    item.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      items.forEach((o) => o !== item && o.classList.contains("is-open") && setOpen(o, false));
      setOpen(item, !wasOpen);
    })
  );
});

export {};

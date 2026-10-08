// Behaviour for Principles.astro (moved out of the component so the Astro and Next builds share it).
// Principle card flip (port of PrincipleCard.tsx): hover on pointer devices,
// tap to toggle on touch. 0.6s cubic-bezier(0.22,1,0.36,1), perspective 1400.
const canHover = window.matchMedia("(hover: hover)");
document.querySelectorAll<HTMLElement>("[data-pcard]").forEach((card) => {
  card.addEventListener("mouseenter", () => canHover.matches && card.classList.add("is-flipped"));
  card.addEventListener("mouseleave", () => canHover.matches && card.classList.remove("is-flipped"));
  card.addEventListener("click", () => !canHover.matches && card.classList.toggle("is-flipped"));
});

export {};

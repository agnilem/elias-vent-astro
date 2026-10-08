// Behaviour for Hero.astro (moved out of the component so the Astro and Next builds share it).
import { initCarousel } from "../carousel";
document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(initCarousel);

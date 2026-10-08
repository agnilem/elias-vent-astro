// Behaviour for Gallery.astro (moved out of the component so the Astro and Next builds share it).
import { initOrbit } from "../orbit";
document.querySelectorAll<HTMLElement>("[data-orbit]").forEach(initOrbit);

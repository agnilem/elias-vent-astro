// Behaviour for Gallery.astro (moved out of the component so the Astro and Next builds share it).
import { initOrbit } from "../orbit";
import { whenNear } from "../lib";
// Built (and its images fetched) when the section is two screens away, not at page load.
document.querySelectorAll<HTMLElement>("[data-orbit]").forEach((el) => whenNear(el, () => initOrbit(el)));

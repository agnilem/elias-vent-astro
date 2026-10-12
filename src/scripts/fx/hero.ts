// Behaviour for Hero.astro (moved out of the component so the Astro and Next builds share it).
import { initCarousel } from "../carousel";
import { afterPaint } from "../lib";
// The WebGL set-up waits for the first frame, so the page paints before the shaders compile.
afterPaint(() => document.querySelectorAll<HTMLElement>("[data-carousel]").forEach(initCarousel));

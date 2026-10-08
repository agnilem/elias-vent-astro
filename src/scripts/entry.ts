/**
 * Every behaviour on the site, in one place. Each module reads the markup
 * already on the page and enhances it; a module whose markup is not on the
 * current page does nothing. The Astro build loads this file from
 * layouts/Base.astro, the Next build from src/app/Scripts.tsx.
 *
 * Order matches the order the components appear in the page (it used to be
 * one <script> per component), with smooth scrolling last.
 */
import "./fx/topbar";
import "./fx/scroll-ring";
import "./fx/hero";
import "./reveal";
import "./fx/about";
import "./fx/awards";
import "./fx/principles";
import "./fx/ticker";
import "./fx/services";
import "./fx/gallery";
import "./fx/faq";
import "./fx/contact";
import "./fx/footer";
import "./smooth-scroll";

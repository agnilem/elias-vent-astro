// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "static",
  site: "https://elias-vent.startfrom.co",
  // Styles go into the page itself, so the first paint does not wait for a stylesheet request.
  build: { inlineStylesheets: "always" },
  // sitemap-index.xml for search engines; the 404 page is left out.
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
});

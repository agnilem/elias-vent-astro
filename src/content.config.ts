import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One Markdown file per case study. Each file builds the /projects/<slug>
// page and a slide in the home page carousel, ordered by `order`.
const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    order: z.number(),
    role: z.string(),
    timeline: z.string(),
    year: z.string(),
    overview: z.string(),
    challenge: z.string(),
    cover: z.string(),
    coverAlt: z.string(),
    showcase: z.string(),
    showcaseAlt: z.string(),
    heroImage: z.string(),
    heroAlt: z.string(),
  }),
});

export const collections = { projects };

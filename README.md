# Elias Vent, an Astro portfolio theme

A dark, motion-led portfolio theme for product and motion designers. Static output, no framework runtime: every interaction is a small vanilla TypeScript module.

## Features

- WebGL cylinder carousel in the hero: project covers curve on a cylinder with a liquid and chromatic shader that reacts to scroll speed. Falls back to plain images without WebGL.
- Lenis smooth scrolling
- Scroll-scrubbed word and block reveals, portrait parallax
- Awards list with a cover image that follows the cursor
- 3D flip cards, a looping ticker, a pinned services switcher, an image fly-in gallery
- FAQ accordion, contact form with loading and success states
- Liquid gradient shader in the footer
- Case study pages generated from Markdown, with a "next project" link
- 404 page with a spinning image ring
- Honours `prefers-reduced-motion`: smooth scrolling, idle animation and reveals are switched off
- Sora font, self-hosted through Fontsource

## Getting started

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # serves dist/
```

## Editing content

- `src/content/site.json` holds all site copy: name, tagline, navigation, socials, awards, principles, services, gallery, FAQ, contact text and the 404 ring images.
- `src/content/projects/*.md` holds one file per case study. The frontmatter fields (title, category, order, role, timeline, year, overview, challenge, images) drive both the home carousel and `/projects/<file-name>`. Any Markdown body renders under the overview (the demo files leave it empty, matching the original).
- Images live in `public/assets/`.
- Colors, type scale and layout live in `src/styles/global.css`.

The contact form has no backend. Point it at your form service in `src/components/sections/Contact.astro`.

## Environment variables

Both are off by default. Set them to `true` to enable.

| Variable | Effect |
| --- | --- |
| `PUBLIC_VERCEL_ANALYTICS` | Loads Vercel Web Analytics and Speed Insights |
| `PUBLIC_STORE_BADGE` | Shows the fixed store badge in the corner |

## Deploy

The build is plain static files in `dist/`, so it runs on any static host. On Vercel or Netlify, import the repo and keep the defaults (build command `npm run build`, output `dist`). Update `site` in `astro.config.mjs` to your domain so canonical and Open Graph URLs are correct.

## License and credits

MIT, see `LICENSE`. Sora is by Jonathan Barnbrook and Julián Moncada, licensed under the SIL Open Font License 1.1. Placeholder images are for demo purposes only; replace them with your own work.

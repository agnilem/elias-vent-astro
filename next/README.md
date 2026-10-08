# Elias Vent for Next.js

The Elias Vent portfolio theme on Next.js 16 (App Router, React 19), exported as a static site. Node 20.9 or later.

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static site in out/
npm start         # serve out/
```

## Where things are

| What | File |
| --- | --- |
| Case studies | `src/content/projects/*.md` (the file name is the URL, `order` sets the carousel order) |
| All other copy: name, tagline, nav, socials, awards, principles, services, gallery, FAQ, contact | `src/content/site.json` |
| Colours, type scale, all styles | `src/styles/site.css` (tokens at the top) |
| Images | `public/assets/` |
| Pages | `src/app/page.tsx` (home), `src/app/projects/[slug]/page.tsx` (case study), `src/app/NotFoundPage.tsx` (404) |
| Sections | `src/components/sections/` |
| Top bar, icons, scroll reveals | `src/components/` |
| Head tags, store badge, analytics | `src/layouts/Base.tsx` |
| Markdown loader for case studies | `src/lib/projects-loader.ts` |
| Behaviour (menu, carousel, reveals, accordion, form...) | `src/scripts/fx/*.ts`, all loaded by `src/scripts/entry.ts` from `src/app/Scripts.tsx` |
| Contact form submission | `src/scripts/fx/contact.ts` (no backend; it shows the success state after 1.2s) |
| Sitemap and robots.txt | `src/app/sitemap.ts`, `src/app/robots.ts` |

Components are server components that render plain markup. Behaviour is plain DOM TypeScript loaded once on the client, so every page is complete before any script runs. Smooth scrolling uses Lenis; the hero carousel and the footer gradient use WebGL and fall back to plain images and colour without it. Every effect honours `prefers-reduced-motion`.

Case study pages render their Markdown body under the overview (the demo files leave it empty). Markdown is GitHub-flavoured with smart quotes and heading ids; code blocks are not syntax-highlighted.

## Environment variables

All are optional.

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your domain, e.g. `https://example.com`. Used for canonical, Open Graph and sitemap URLs. |
| `NEXT_PUBLIC_VERCEL_ANALYTICS=true` | Loads Vercel Web Analytics and Speed Insights. |
| `NEXT_PUBLIC_STORE_BADGE=true` | Shows the fixed store badge in the corner. |
| `NEXT_PUBLIC_GA_ID=G-XXXX` | Loads Google Analytics. |

## Deploy

Any static host. On Vercel, import the folder; it detects Next.js. Elsewhere, upload `out/`. URLs end in a slash (`/projects/fauna/`), set by `trailingSlash` in `next.config.ts` and `vercel.json`.

## License and credits

MIT, see `LICENSE`. Sora is by Jonathan Barnbrook and Julián Moncada, licensed under the SIL Open Font License 1.1, and loads from `@fontsource/sora`. Placeholder images are for demo purposes only; replace them with your own work.

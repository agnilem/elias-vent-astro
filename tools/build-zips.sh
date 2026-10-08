#!/usr/bin/env bash
# Regenerate the Next build, check both builds compile, and pack the zips:
#   zips/elias-vent-astro.zip  the Astro theme (this folder)
#   zips/elias-vent-next.zip   the Next.js version (next/)
#   zips/elias-vent-code.zip   both, as astro/ and next/
# Dev-only files (tools, baselines, launch notes, env files) never ship.
set -euo pipefail
cd "$(dirname "$0")/.."

node tools/astro-to-next.mjs
node tools/collect-css.mjs
rsync -a --delete public/ next/public/
npx astro build > /dev/null
(cd next && npx next build > /dev/null)

stage=$(mktemp -d); trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/astro" "$stage/next"
rsync -a --exclude node_modules --exclude dist --exclude .astro --exclude tools --exclude next --exclude zips \
  --exclude launch --exclude .baseline-dist --exclude .checks --exclude '.env*' --exclude .vercel --exclude .vercelignore \
  --exclude .git --exclude .DS_Store ./ "$stage/astro/"
rsync -a --exclude node_modules --exclude .next --exclude out --exclude '.env*' --exclude .vercel --exclude next-env.d.ts \
  --exclude tsconfig.tsbuildinfo --exclude .DS_Store next/ "$stage/next/"
cp LICENSE "$stage/next/LICENSE"
# The repo README (Astro) mentions next/; in the Astro-only zip there is none.
perl -0pi -e 's/\n## Next\.js version\n.*?(?=\n## )//s' "$stage/astro/README.md"
perl -0pi -e 's/ This folder is the Astro theme; the same site for Next\.js is in \[`next\/`\]\(next\/\)\.//' "$stage/astro/README.md"
if grep -q 'next/' "$stage/astro/README.md"; then echo "Astro README still points at next/" >&2; exit 1; fi
# Generated-file banners point at the Astro source and the generator, which the
# Next-only download does not include: say what the files are instead.
find "$stage/next/src" -type f \( -name '*.tsx' -o -name '*.ts' \) -exec sed -i '' -E '1s#^// GENERATED (from|by) .*#// Elias Vent for Next.js. Generated from the Elias Vent Astro source; edit freely.#' {} +
sed -i '' -E '1s#^/\* GENERATED .*\*/#/* Elias Vent for Next.js: every style in one sheet. Tokens first. */#' "$stage/next/src/styles/site.css"

# Nothing that identifies the demo deployment ships.
if grep -rIl 'polar_cl_\|G-ZDTVFGHC5K\|apollostudio' "$stage"; then echo "demo-only values in bundle" >&2; exit 1; fi
if find "$stage" -name '.env*' -o -name node_modules -o -name .vercel | grep -q .; then echo "env/node_modules/.vercel in bundle" >&2; exit 1; fi

rm -rf zips && mkdir zips
(cd "$stage/astro" && zip -rq "$OLDPWD/zips/elias-vent-astro.zip" . -x '*.DS_Store')
(cd "$stage/next" && zip -rq "$OLDPWD/zips/elias-vent-next.zip" . -x '*.DS_Store')
d="$stage/pack-all"; mkdir -p "$d"; cp -R "$stage/astro" "$stage/next" "$d/"; cp LICENSE "$d/"
cat > "$d/README.md" <<'MD'
# Elias Vent: Astro and Next.js

Two builds of the same portfolio site. Pick one. They are visually identical, checked element by element on every page at desktop, tablet and phone widths.

| Folder | Stack | Use it when |
| --- | --- | --- |
| `astro/` | Astro 7, static output | You want components and almost no JavaScript. |
| `next/` | Next.js 16, App Router, static export | You already work in React. |

Each folder has its own README with commands and the files to edit. Both share the same content files (`src/content/`), styles and behaviour scripts (`src/scripts/`).

MIT licensed, see `LICENSE`.
MD
(cd "$d" && zip -rq "$OLDPWD/zips/elias-vent-code.zip" . -x '*.DS_Store')
ls -lh zips | awk 'NR>1 {printf "  %-24s %s\n", $9, $5}'

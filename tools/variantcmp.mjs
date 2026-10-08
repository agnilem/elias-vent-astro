// Compare two builds element by element (the acceptance test).
// Both render the same markup, so the n-th element with a class in one build is
// the n-th in the other. Reports every element whose box differs by more than
// MAX px, per route and width, after a scroll-through so reveals have settled,
// plus element count, page height and console errors on both sides.
// usage: A=http://localhost:4531 B=http://localhost:4532 node tools/variantcmp.mjs [maxPx=2]
import { chromium, executable } from './pw.mjs';
const MAX = Number(process.argv[2] || 2);
const A = process.env.A || 'http://localhost:4531';
const B = process.env.B || 'http://localhost:4532';
const routes = (process.env.ROUTES || '/,/projects/fauna/,/projects/halo/,/projects/lumen/,/projects/orbit/,/projects/pace/,/nope/').split(',');
// 1440/1000/390 plus both sides of every breakpoint in global.css (1200, 810, 760, 600).
const NOT_FOUND = '/nope/';
const widths = (process.env.WIDTHS || '1440,1000,390,1200,1199,810,809,760,759,600,599').split(',').map(Number);
const b = await chromium.launch({ executablePath: executable(), headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

async function grab(base, path, w) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  // The 404 route's own document answers 404 on purpose; anything else is an error.
  p.on('console', (m) => m.type() === 'error' && !(path === NOT_FOUND && /status of 404/.test(m.text()) && m.location().url === base + path) && errs.push(m.text().slice(0, 140)));
  await p.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 });
  await p.evaluate(() => document.fonts.ready);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  // SCROLL=0 skips the scroll-through: with reduced motion nothing needs it to
  // settle, and on the home page it leaves scroll-history state (active slide,
  // current service) that differs run to run on a loaded machine.
  if (process.env.SCROLL !== '0') for (let y = 0; y < H; y += 700) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(40); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
  const snap = () => p.evaluate(() => [...document.querySelectorAll('body [class]')]
    .filter((el) => !el.closest('nextjs-portal, script, style, template'))
    .map((el) => { const r = el.getBoundingClientRect(); return { c: el.getAttribute('class').split(/\s+/).filter((x) => !x.startsWith('astro-')).join('.'), x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; }));
  // Scroll-smoothed pieces (the hero carousel lerps toward the scroll position)
  // keep moving for a while after the scroll-through: wait until two snapshots
  // half a second apart agree, so a slow machine does not read them mid-glide.
  let rows = await snap();
  for (let i = 0; i < 40; i++) {
    await p.waitForTimeout(500);
    const next = await snap();
    const same = next.length === rows.length && next.every((r, k) => r.c === rows[k].c && Math.abs(r.y - rows[k].y) < 0.5 && Math.abs(r.x - rows[k].x) < 0.5);
    rows = next;
    if (same) break;
  }
  const html = await p.evaluate(() => document.documentElement.scrollHeight);
  await ctx.close();
  return { rows, H: html, errs };
}

let bad = 0, ok = 0;
const jobs = widths.flatMap((w) => routes.map((r) => [w, r]));
const lines = new Map();
async function run([w, r]) {
  const [a, n] = await Promise.all([grab(A, r, w), grab(B, r, w)]);
  const diffs = [];
  if (a.rows.length !== n.rows.length) diffs.push(`element count ${a.rows.length} vs ${n.rows.length}`);
  const len = Math.min(a.rows.length, n.rows.length);
  for (let i = 0; i < len; i++) {
    const x = a.rows[i], y = n.rows[i];
    if (x.c !== y.c) { diffs.push(`#${i} class "${x.c}" vs "${y.c}"`); break; }
    const d = Math.max(Math.abs(x.x - y.x), Math.abs(x.y - y.y), Math.abs(x.w - y.w), Math.abs(x.h - y.h));
    if (d > MAX) diffs.push(`#${i} .${x.c} Δ${d.toFixed(1)} (${Math.round(x.x)},${Math.round(x.y)} ${Math.round(x.w)}x${Math.round(x.h)} vs ${Math.round(y.x)},${Math.round(y.y)} ${Math.round(y.w)}x${Math.round(y.h)})`);
  }
  if (a.H !== n.H) diffs.push(`page height ${a.H} vs ${n.H}`);
  for (const e of a.errs) diffs.push('A console: ' + e);
  for (const e of n.errs) diffs.push('B console: ' + e);
  lines.set(`${w} ${r}`, [`${diffs.length ? '!!' : 'ok'} ${w} ${r} (${a.rows.length} elements, ${a.H}px)`, ...diffs.slice(0, 12).map((d) => '   ' + d)]);
  if (diffs.length) bad++; else ok++;
}
const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await run(queue.shift()); }));
for (const [w, r] of jobs) console.log(lines.get(`${w} ${r}`).join('\n'));
console.log(`\n${ok} pass, ${bad} fail (${routes.length} routes x ${widths.length} widths, ${A} vs ${B})`);
await b.close();
process.exit(bad ? 1 : 0);

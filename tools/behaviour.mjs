// Exercise every interactive behaviour by script and print what each one did,
// so two builds can be compared. Motion is on (no reduced-motion), and every
// recorded value is a discrete state or a rounded number, so the same
// behaviour gives the same output in every build.
// usage: node tools/behaviour.mjs http://localhost:4531 [http://localhost:4532 ...]
import { chromium, executable } from './pw.mjs';

const bases = process.argv.slice(2);
const b = await chromium.launch({ executablePath: executable(), headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const wait = (p, ms) => p.waitForTimeout(ms);
const r = (v, step = 1) => Math.round(v / step) * step;

async function page(base, path, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: opts.w ?? 1440, height: 900 }, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)));
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => document.documentElement.classList.contains('lenis') || matchMedia('(prefers-reduced-motion: reduce)').matches);
  await wait(p, 300);
  return { p, ctx, errs };
}
// Jump without Lenis smoothing, then let scroll handlers and springs settle.
const jump = async (p, y, ms = 900) => { await p.evaluate((v) => (window.__lenis ? window.__lenis.scrollTo(v, { immediate: true }) : scrollTo(0, v)), y); await wait(p, ms); };
const topOf = (p, sel) => p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);

async function run(base) {
  const out = {};
  const errors = [];

  // ---- home, desktop
  {
    const { p, ctx, errs } = await page(base, '/');
    out.lenis = await p.evaluate(() => ({ html: document.documentElement.className, api: typeof window.__lenis?.scrollTo }));
    // Hero carousel: WebGL canvas drawn, nav buttons move the active slide.
    out.carousel = await p.evaluate(() => {
      const c = document.querySelector('.pc-canvas');
      return { canvas: c.width > 0 && c.height > 0, fallbackHidden: getComputedStyle(document.querySelector('.pc-fallback')).display, active: [...document.querySelectorAll('[data-overlay]')].findIndex((o) => o.classList.contains('pc-ref-active')) };
    });
    await p.click('[data-goto="2"]');
    await wait(p, 2500);
    out.carouselGoto2 = await p.evaluate(() => ({
      active: [...document.querySelectorAll('[data-overlay]')].findIndex((o) => o.classList.contains('pc-ref-active')),
      bar: [...document.querySelectorAll('.pc-nav-bar')].findIndex((o) => o.classList.contains('pc-nav-active')),
      current: [...document.querySelectorAll('[data-goto]')].findIndex((o) => o.getAttribute('aria-current') === 'true'),
      scrolled: scrollY > 0,
    }));
    // Topbar: hides on scroll-down past the hero, shows on scroll-up.
    const heroBottom = await p.evaluate(() => document.getElementById('hero').getBoundingClientRect().bottom + scrollY);
    await jump(p, heroBottom + 400);
    await p.mouse.wheel(0, 300); await wait(p, 1200);
    out.topbarDown = await p.evaluate(() => ({ t: document.querySelector('[data-topbar]').style.transform, o: document.querySelector('[data-topbar]').style.opacity }));
    await p.mouse.wheel(0, -300);
    await p.waitForFunction(() => document.querySelector('[data-topbar]').style.transform === '', null, { timeout: 8000 }).catch(() => {});
    out.topbarUp = await p.evaluate(() => ({ t: document.querySelector('[data-topbar]').style.transform, o: document.querySelector('[data-topbar]').style.opacity }));
    // About: portrait parallax + word and block reveals.
    const about = await topOf(p, '#about-alt');
    await jump(p, about - 300);
    out.parallax = await p.evaluate(() => /^translate3d\(0px, -?[\d.]+px, 0px\) scale\([\d.]+\)$/.test(document.querySelector('[data-parallax]').style.transform));
    const words = (p) => p.evaluate(() => [...document.querySelectorAll('#about-alt .sw')].map((s) => Math.round(Number(s.style.opacity) * 10) / 10).join(','));
    out.wordsBefore = await words(p);
    await jump(p, about + 500);
    out.wordsAfter = await words(p);
    out.blockFade = await p.evaluate(() => { const s = document.querySelector('.sf').style; return { o: s.opacity, t: s.transform, f: s.filter }; });
    // Awards: hover a row, cover follows the cursor.
    const row = await p.$('[data-row="3"]');
    await row.scrollIntoViewIfNeeded(); await wait(p, 600);
    const box = await row.boundingBox();
    await p.mouse.move(box.x + 200, box.y + box.height / 2); await wait(p, 1500);
    await p.waitForFunction((x) => document.querySelector('[data-cursor]').style.transform.startsWith(`translate3d(${x}px`), Math.round(box.x + 200), { timeout: 8000 }).catch(() => {});
    out.awards = await p.evaluate(() => ({
      active: [...document.querySelectorAll('[data-row]')].findIndex((x) => x.classList.contains('is-active')),
      cursorOn: document.querySelector('[data-cursor]').classList.contains('is-on'),
      img: [...document.querySelectorAll('[data-cursor] img')].findIndex((x) => x.classList.contains('is-on')),
      transform: document.querySelector('[data-cursor]').style.transform,
    }));
    await p.mouse.move(5, 5); await wait(p, 300);
    out.awardsLeave = await p.evaluate(() => document.querySelectorAll('[data-row].is-active').length);
    // Principles: flip on hover.
    const card = await p.$('[data-pcard]');
    await card.scrollIntoViewIfNeeded(); await wait(p, 400);
    await card.hover(); await wait(p, 300);
    out.flipHover = await p.evaluate(() => [...document.querySelectorAll('[data-pcard]')].map((c) => c.classList.contains('is-flipped')).join(','));
    await p.mouse.move(5, 5); await wait(p, 300);
    out.flipLeave = await p.evaluate(() => document.querySelectorAll('[data-pcard].is-flipped').length);
    // Ticker: duration from width at 50px/s.
    out.ticker = await p.evaluate(() => { const el = document.querySelector('[data-ticker]'); return el.style.animationDuration === `${el.scrollWidth / 2 / 50}s` && getComputedStyle(el).animationName !== 'none'; });
    // Services: scroll picks the service; clicking a name scrolls to it.
    const svc = await p.evaluate(() => { const el = document.querySelector('[data-services]'); return { top: el.getBoundingClientRect().top + scrollY, total: el.offsetHeight - innerHeight }; });
    const svcState = () => p.evaluate(() => ({
      counter: document.querySelector('[data-counter]').textContent,
      white: [...document.querySelectorAll('[data-name]')].findIndex((n) => n.style.color === 'var(--white)'),
      img: [...document.querySelectorAll('.services-image img')].findIndex((i) => i.classList.contains('is-on')),
      caps: [...document.querySelectorAll('[data-caps] p')].map((x) => x.textContent).join('|'),
      fill: document.querySelector('[data-fill]').style.width,
    }));
    out.services = [];
    for (const f of [0.1, 0.4, 0.6, 0.95]) { await jump(p, svc.top + svc.total * f, 700); out.services.push(await svcState()); }
    await p.click('[data-name="1"]'); await wait(p, 2500);
    out.servicesClick = await svcState();
    // Gallery orbit: images built and moving with scroll.
    const gal = await topOf(p, '#work');
    await jump(p, gal, 1200);
    const orbitA = await p.evaluate(() => ({ n: document.querySelectorAll('[data-layer] img, [data-layer] > *').length, t: [...document.querySelectorAll('[data-layer] > *')].map((x) => x.style.transform).join('|') }));
    await jump(p, gal + 600, 1500);
    const orbitB = await p.evaluate(() => [...document.querySelectorAll('[data-layer] > *')].map((x) => x.style.transform).join('|'));
    out.orbit = { items: orbitA.n, moved: orbitA.t !== orbitB };
    // FAQ: one open at a time.
    const items = await p.$$('.faq-item');
    await items[0].scrollIntoViewIfNeeded(); await wait(p, 400);
    const faq = () => p.evaluate(() => [...document.querySelectorAll('.faq-item')].map((x) => `${x.classList.contains('is-open') ? 1 : 0}${x.getAttribute('aria-expanded')[0]}${Math.round(x.getBoundingClientRect().height)}`).join(','));
    out.faq0 = await faq();
    await items[0].click(); await wait(p, 1500); out.faq1 = await faq();
    await items[2].click(); await wait(p, 1500); out.faq2 = await faq();
    await items[2].click(); await wait(p, 1500); out.faq3 = await faq();
    // Contact form: disabled until the email is valid, then Sending… -> Thank you.
    await p.$eval('[data-contact-form]', (f) => f.scrollIntoView()); await wait(p, 400);
    const btn = () => p.evaluate(() => { const b = document.querySelector('[data-contact-form] .submit'); return `${b.className}|${b.disabled}|${b.textContent.trim()}`; });
    out.form0 = await btn();
    await p.fill('[data-contact-form] input[name=email]', 'not-an-email'); out.form1 = await btn();
    await p.fill('[data-contact-form] input[name=email]', 'a@b.co'); out.form2 = await btn();
    await p.click('[data-contact-form] .submit'); await wait(p, 200); out.form3 = await btn();
    await wait(p, 1300); out.form4 = await btn();
    // Footer: shader canvas sized, wordmark fitted to the container.
    await jump(p, await p.evaluate(() => document.documentElement.scrollHeight), 1200);
    out.footer = await p.evaluate(() => {
      const c = document.querySelector('[data-shader]'); const box = document.querySelector('[data-fit]');
      return { canvas: c.width > 0 && c.height > 0, font: r(parseFloat(box.style.fontSize), 0.5) };
      function r(v, s) { return Math.round(v / s) * s; }
    });
    // Nav anchor: "Contact me" lands on #contact.
    await jump(p, 0, 600);
    await p.click('.topbar-links a[href="/#contact"]'); await wait(p, 2500);
    out.anchor = await p.evaluate(() => Math.abs(document.getElementById('contact').getBoundingClientRect().top) < 5);
    errors.push(...errs.map((e) => 'home desktop: ' + e));
    await ctx.close();
  }

  // ---- home, phone (touch): menu drawer, tap-to-flip cards
  {
    const { p, ctx, errs } = await page(base, '/', { w: 390, touch: true });
    const menu = () => p.evaluate(() => {
      const nav = document.querySelector('[data-mobile-nav]'); const btn = document.querySelector('[data-menu-btn]');
      return `${nav.classList.contains('is-open')}|${nav.getAttribute('aria-hidden')}|${btn.getAttribute('aria-expanded')}|${btn.getAttribute('aria-label')}|${document.querySelector('[data-icon-open]').style.opacity}|${document.querySelector('[data-icon-close]').style.opacity}|${[...nav.querySelectorAll('a')].map((a) => a.getAttribute('tabindex')).join('')}`;
    });
    out.menu0 = await menu();
    await p.tap('[data-menu-btn]'); await wait(p, 600); out.menu1 = await menu();
    await p.tap('[data-menu-btn]'); await wait(p, 600); out.menu2 = await menu();
    await p.tap('[data-menu-btn]'); await wait(p, 600);
    await p.tap('[data-mobile-nav] a[href="/#about-alt"]'); await wait(p, 1500); out.menu3 = await menu();
    // Lenis owns scrolling, so jump with it instead of Playwright's scrollIntoView.
    await jump(p, (await topOf(p, '[data-pcard]')) - 200);
    const card = await p.$('[data-pcard]');
    await card.tap({ force: true }); await wait(p, 300); out.flipTap = await p.evaluate(() => document.querySelectorAll('[data-pcard].is-flipped').length);
    await card.tap({ force: true }); await wait(p, 300); out.flipTap2 = await p.evaluate(() => document.querySelectorAll('[data-pcard].is-flipped').length);
    errors.push(...errs.map((e) => 'home phone: ' + e));
    await ctx.close();
  }

  // ---- project page: next-project link, contact form present, topbar
  {
    const { p, ctx, errs } = await page(base, '/projects/fauna/');
    out.project = await p.evaluate(() => ({ next: document.querySelector('.next-link')?.getAttribute('href'), current: document.querySelectorAll('.is-current').length, words: document.querySelectorAll('.sw').length }));
    errors.push(...errs.map((e) => 'project: ' + e));
    await ctx.close();
  }

  // ---- 404: ring radius fitted, wheel spins it
  {
    const { p, ctx, errs } = await page(base, '/nope/', { w: 1000 });
    const rot = () => p.evaluate(() => { const m = document.querySelector('[data-wheel]').style.transform.match(/rotate\(([-\d.e]+)deg\)/); return m ? Number(m[1]) : null; });
    out.ringR = await p.evaluate(() => document.querySelector('[data-wheel]').style.getPropertyValue('--r'));
    // Idle spin turns the ring 2deg/s; a wheel of 800px adds 16deg on top.
    await wait(p, 500);
    const a = await rot(); await p.mouse.move(500, 450); await p.mouse.wheel(0, 800);
    const t0 = Date.now();
    await p.waitForFunction((a) => { const m = document.querySelector('[data-wheel]').style.transform.match(/rotate\(([-\d.e]+)deg\)/); return m && Number(m[1]) - a > 14; }, a, { timeout: 10000 }).catch(() => {});
    out.ringSpin = a !== null && (await rot()) - a > 14;
    errors.push(...errs.filter((e) => !/status of 404/.test(e)).map((e) => '404: ' + e));
    await ctx.close();
  }
  out.errors = errors;
  return out;
}

const results = [];
for (const base of bases) results.push(await run(base));
await b.close();
const keys = Object.keys(results[0]);
let same = 0;
for (const k of keys) {
  const vals = results.map((x) => JSON.stringify(x[k]));
  const ok = vals.every((v) => v === vals[0]);
  if (ok) same++;
  console.log(`${ok ? 'same' : 'DIFF'} ${k}: ${vals[0]}${ok ? '' : '\n      ' + vals.slice(1).join('\n      ')}`);
}
console.log(`\n${same}/${keys.length} behaviours identical across ${bases.join(', ')}`);
process.exit(same === keys.length && !results.some((x) => x.errors.length) ? 0 : 1);

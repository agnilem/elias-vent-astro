import { Spring, reducedMotion } from "./lib";

/**
 * Image fly-in field (port of OrbitGallery.tsx). Fills the sticky pin inside the
 * tall gallery section; as the section scrolls, images fly from deep in the page
 * toward the viewer along golden-angle lanes, smoothed with a spring
 * (80/24/0.6), with a subtle cursor parallax on desktop.
 */
const CFG = { cardCount: 12, speed: 3.5, spread: 80, holeBuffer: 40, maxZoom: 2.6, parallax: 26, cardWidth: 246, cardHeight: 160 };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const frac = (x: number) => x - Math.floor(x);
const rand = (seed: number) => frac(Math.sin(seed * 12.9898) * 43758.5453);
const MIN_SCALE = 0.16;
const GOLDEN = 2.399963229728653;

interface Card {
  el: HTMLElement;
  dirX: number;
  dirY: number;
  laneR: number;
  phase: number;
}

export function initOrbit(root: HTMLElement) {
  const layer = root.querySelector<HTMLElement>("[data-layer]")!;
  const glow = root.querySelector<HTMLElement>("[data-glow]")!;
  const images: Array<{ src: string; alt: string }> = JSON.parse(root.dataset.images || "[]");
  if (!images.length) return;
  const { cardCount, speed, spread, holeBuffer, maxZoom, parallax, cardWidth, cardHeight } = CFG;
  const calm = reducedMotion();

  let size = { w: root.clientWidth || 1200, h: root.clientHeight || 820 };
  let isMobile = size.w < 700;
  let cards: Card[] = [];
  const build = () => {
    const count = isMobile ? Math.min(cardCount, 7) : cardCount;
    layer.replaceChildren();
    cards = Array.from({ length: count }, (_, k) => {
      const theta = k * GOLDEN + rand(k) * 0.8;
      const laneR = 0.7 + rand(k + 7) * 0.6;
      const sizeF = 0.82 + rand(k + 3) * 0.5;
      const phase = k / count + rand(k + 11) * 0.06;
      const w = cardWidth * sizeF;
      const h = cardHeight * sizeF;
      const el = document.createElement("div");
      el.className = "og-card";
      el.style.cssText = `width:${w}px;height:${h}px;margin-left:${-w / 2}px;margin-top:${-h / 2}px`;
      const img = document.createElement("img");
      const src = images[k % images.length];
      img.src = src.src;
      img.alt = src.alt;
      img.draggable = false;
      img.loading = "lazy";
      el.appendChild(img);
      layer.appendChild(el);
      return { el, dirX: Math.cos(theta), dirY: Math.sin(theta), laneR, phase };
    });
    glow.style.width = glow.style.height = `${isMobile ? Math.min(size.w * 0.92, 440) : 640}px`;
  };
  build();

  // the scroller is the first ancestor at least 1.4 viewports tall (the section)
  const findScroller = (): HTMLElement => {
    let node: HTMLElement | null = root;
    while (node) {
      if (node.offsetHeight >= window.innerHeight * 1.4) return node;
      node = node.parentElement;
    }
    return root;
  };
  let scroller = findScroller();
  const progress = new Spring(0, 80, 24, 0.6);
  const mx = new Spring(0, 40, 18, 0.8);
  const my = new Spring(0, 40, 18, 0.8);
  const readProgress = () => {
    const rect = scroller.getBoundingClientRect();
    const range = scroller.offsetHeight - window.innerHeight;
    return range > 0 ? clamp01(-rect.top / range) : 0;
  };
  progress.jump(readProgress());

  const render = () => {
    const spreadPx = isMobile ? size.w * (spread / 100) * 0.72 : Math.min(size.w, size.h) * (spread / 100);
    const holeR = isMobile ? size.w * 0.14 + 36 : Math.max(size.w, size.h) * (holeBuffer / 100) * 0.5 + 120;
    const par = isMobile ? 0 : parallax;
    const prog = progress.x;
    for (const c of cards) {
      const p = frac(c.phase + prog * speed);
      const s = MIN_SCALE * Math.pow(maxZoom / MIN_SCALE, p);
      const r = spreadPx * c.laneR * s;
      const fade = smoothstep(0.08, 0.26, p) * (1 - smoothstep(0.66, 0.9, p));
      const hole = smoothstep(holeR * 0.82, holeR * 1.08, r);
      const blur = Math.max(0, (0.55 - s) * 5);
      const x = c.dirX * r + mx.x * par * Math.min(s, 1.6);
      const y = c.dirY * r + my.x * par * Math.min(s, 1.6);
      c.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      c.el.style.opacity = (fade * hole).toFixed(3);
      c.el.style.zIndex = String(Math.round(s * 100));
      c.el.style.filter = `blur(${blur.toFixed(2)}px)`;
    }
  };

  let raf = 0;
  let last = 0;
  let inView = false;
  const tick = (t: number) => {
    const dt = last ? (t - last) / 1000 : 1 / 60;
    last = t;
    progress.set(readProgress());
    if (calm) progress.jump(progress.target);
    progress.step(dt);
    mx.step(dt);
    my.step(dt);
    render();
    if (inView) raf = requestAnimationFrame(tick);
    else {
      raf = 0;
      last = 0;
    }
  };
  new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? false;
    if (inView && !raf) raf = requestAnimationFrame(tick);
  }).observe(root);
  render();

  window.addEventListener("resize", () => {
    const wasMobile = isMobile;
    size = { w: root.clientWidth || 1, h: root.clientHeight || 1 };
    isMobile = size.w < 700;
    if (wasMobile !== isMobile) build();
    scroller = findScroller();
    render();
  });
  window.addEventListener("mousemove", (e) => {
    if (isMobile || calm) return;
    const r = root.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  });
}

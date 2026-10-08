import { clamp, reducedMotion, scrollToY } from "./lib";

/**
 * Project Carousel (port of the Framer code component ProjectCarousel.tsx).
 * The stage is pinned; one smoothed scroll value drives the WebGL cover planes
 * and the HTML title overlay together. Covers are drawn as planes mapped onto a
 * cylinder with a liquid + chromatic-aberration shader reacting to scroll
 * velocity. Titles move 1:1 and reveal letter by letter; images trail slightly.
 * Falls back to stacked <img>s when WebGL is absent.
 */
const CFG = {
  baseTilt: 0,
  skewStrength: 0,
  curve: 1.4,
  parallax: 0.8,
  smoothness: 0.16,
  distortion: 2.6,
  chroma: 1.3,
  maxWidth: 1400,
  radius: 20,
  tint: 0.4,
};

const VERT = `
attribute vec2 aPos;
uniform vec2 uHalf;
uniform vec2 uRes;
uniform float uTiltZ;
uniform float uSkewY;
uniform float uAngle;
uniform float uRadius;
uniform float uPersp;
uniform float uShiftX;
varying vec2 vUv;
void main(){
  vUv = vec2(aPos.x * 0.5 + 0.5, aPos.y * 0.5 + 0.5);
  vec2 lp = vec2(aPos.x * uHalf.x, aPos.y * uHalf.y);
  lp.y += uSkewY * lp.x;
  float cs = cos(uTiltZ), sn = sin(uTiltZ);
  vec2 rp = vec2(lp.x * cs - lp.y * sn, lp.x * sn + lp.y * cs);
  float ang = uAngle + rp.y / uRadius;
  float wx = rp.x;
  float wy = uRadius * sin(ang);
  float wz = uRadius * (1.0 - cos(ang));
  float scale = uPersp / (uPersp - wz);
  float clipX = (wx * scale - uShiftX) / (uRes.x * 0.5);
  float clipY = (wy * scale) / (uRes.y * 0.5);
  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uImgA;
uniform float uBoxA;
uniform float uTime;
uniform float uAmp;
uniform float uChroma;
uniform float uVel;
uniform float uTint;
uniform vec2 uPlanePx;
uniform float uRadiusPx;
vec2 cover(vec2 uv, float ia, float ba){
  vec2 s = ia > ba ? vec2(ba/ia, 1.0) : vec2(1.0, ia/ba);
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = cover(vUv, uImgA, uBoxA);
  float mv = min(abs(uVel), 3.0);
  float v = uAmp * (0.28 + mv * 0.85);
  vec2 flow;
  flow.x = sin(uv.y * 9.0 + uTime * 1.3) * 0.012 * v;
  flow.y = cos(uv.x * 7.0 - uTime * 1.05) * 0.012 * v;
  uv += flow;
  float ch = uChroma * (0.003 + mv * 0.004);
  vec2 dir = vec2(ch, ch * 0.35);
  float r = texture2D(uTex, uv + dir).r;
  float g = texture2D(uTex, uv).g;
  float b = texture2D(uTex, uv - dir).b;
  vec3 col = vec3(r, g, b) * (1.0 - uTint);
  vec2 halfP = uPlanePx * 0.5;
  vec2 p = (vUv - 0.5) * uPlanePx;
  float rr = min(uRadiusPx, min(halfP.x, halfP.y));
  vec2 q = abs(p) - (halfP - vec2(rr));
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr;
  float alpha = 1.0 - smoothstep(0.0, 1.5, d);
  gl_FragColor = vec4(col, alpha);
}`;

export function initCarousel(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>(".pc-canvas");
  const overlays = Array.from(root.querySelectorAll<HTMLElement>("[data-overlay]"));
  const bar = root.querySelector<HTMLElement>("[data-bar]");
  const navBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-goto]"));
  const srcs: string[] = JSON.parse(root.dataset.slides || "[]");
  const n = srcs.length;
  const tablet = window.matchMedia("(max-width: 1199px)");
  const phone = window.matchMedia("(max-width: 809px)");
  const spacing = () => (phone.matches ? 60 : 75);
  const imageWidth = () => (phone.matches ? 92 : tablet.matches ? 84 : 80);
  const imageHeight = () => (phone.matches ? 50 : tablet.matches ? 58 : 68);
  // Reduced motion: keep the scroll-linked layout but drop the idle liquid drift.
  const calm = reducedMotion();

  let active = 0;
  const setActive = (i: number) => {
    active = i;
    overlays.forEach((o, k) => o.classList.toggle("pc-ref-active", k === i));
    navBtns.forEach((b, k) => {
      if (k === i) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
      b.firstElementChild?.classList.toggle("pc-nav-active", k === i);
    });
  };

  navBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const i = Number(b.dataset.goto);
      const step = (clamp(spacing(), 40, 300) / 100) * window.innerHeight;
      const rootTopAbs = root.getBoundingClientRect().top + window.scrollY;
      scrollToY(rootTopAbs + i * step);
    })
  );

  const fail = () => root.classList.add("pc-nogl");
  if (!canvas) return fail();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let gl: any = null;
  try {
    gl = canvas.getContext("webgl", { antialias: true, premultipliedAlpha: false }) || canvas.getContext("experimental-webgl");
  } catch {
    gl = null;
  }
  if (!gl) return fail();
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fail();
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const SEG = 26;
  const verts: number[] = [];
  for (let j = 0; j < SEG; j++) {
    const y0 = -1 + (2 * j) / SEG;
    const y1 = -1 + (2 * (j + 1)) / SEG;
    verts.push(-1, y0, 1, y0, -1, y1, -1, y1, 1, y0, 1, y1);
  }
  const vertCount = verts.length / 2;
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const uni = {
    uHalf: u("uHalf"), uRes: u("uRes"), uTiltZ: u("uTiltZ"), uSkewY: u("uSkewY"), uAngle: u("uAngle"), uRadius: u("uRadius"),
    uPersp: u("uPersp"), uShiftX: u("uShiftX"), uTex: u("uTex"), uImgA: u("uImgA"), uBoxA: u("uBoxA"), uTime: u("uTime"),
    uAmp: u("uAmp"), uChroma: u("uChroma"), uVel: u("uVel"), uTint: u("uTint"), uPlanePx: u("uPlanePx"), uRadiusPx: u("uRadiusPx"),
  };

  const texs: Array<{ tex: WebGLTexture; aspect: number } | null> = new Array(n).fill(null);
  srcs.forEach((src, i) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        texs[i] = { tex, aspect: img.naturalWidth / (img.naturalHeight || 1) || 1.5 };
      } catch {
        /* ignore */
      }
    };
    img.src = src;
  });

  let W = 0;
  let H = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const { baseTilt, skewStrength, curve, parallax, smoothness, distortion, chroma, maxWidth, radius, tint } = CFG;
  const ease = clamp(smoothness, 0.02, 1);
  let smooth: number | null = null;
  let smoothImg: number | null = null;
  let lastS = 0;
  let velSmooth = 0;
  let raf = 0;
  let running = false;
  let inView = true;
  const t0 = performance.now();

  const frame = () => {
    if (W !== canvas.clientWidth || H !== canvas.clientHeight) resize();
    const t = calm ? 0 : (performance.now() - t0) / 1000;
    const target = -root.getBoundingClientRect().top;
    if (smooth === null) smooth = target;
    if (smoothImg === null) smoothImg = target;
    smooth += (target - smooth) * ease;
    const imgEase = clamp(ease * (1 - 0.75 * clamp(parallax, 0, 1)), 0.02, 1);
    smoothImg += (target - smoothImg) * imgEase;
    const s = smooth;
    const sImg = smoothImg;
    const rawVel = s - lastS;
    lastS = s;
    velSmooth += (rawVel - velSmooth) * 0.1;
    const vel = calm ? 0 : velSmooth;
    const skew = clamp(vel * 0.02 * skewStrength, -0.5, 0.5);

    const tinyW = W < 600;
    const sideGutter = tinyW ? 40 : 128;
    const planeW = Math.min(tinyW ? W - sideGutter : (imageWidth() / 100) * W, maxWidth, W - sideGutter);
    const planeH = (imageHeight() / 100) * H;
    const theta = (baseTilt * Math.PI) / 180 + skew * 0.35;
    const arc = clamp(curve, 0, 2) * 0.9;
    const R = arc > 0.001 ? H / arc : H * 1000;
    const step = (clamp(spacing(), 40, 300) / 100) * H;
    if (bar) {
      const f = clamp((s - (n - 1) * step) / (step * 0.5), 0, 1);
      bar.style.opacity = String(1 - f);
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let best = 0;
    let bestDist = Infinity;
    const draws: Array<{ imgOff: number; tex: { tex: WebGLTexture; aspect: number } }> = [];
    for (let i = 0; i < n; i++) {
      const offset = i * step - s;
      const ov = overlays[i];
      if (ov) ov.style.transform = `translate3d(0, ${offset}px, 0)`;
      if (Math.abs(offset) < bestDist) {
        bestDist = Math.abs(offset);
        best = i;
      }
      const imgOff = i * step - sImg;
      if (imgOff < -1.6 * H || imgOff > 1.6 * H) continue;
      const tex = texs[i];
      if (tex) draws.push({ imgOff, tex });
    }
    draws.sort((a, b) => Math.abs(b.imgOff) - Math.abs(a.imgOff));
    gl.uniform2f(uni.uRes, W, H);
    gl.uniform1f(uni.uShiftX, 0);
    gl.uniform2f(uni.uHalf, planeW / 2, planeH / 2);
    gl.uniform2f(uni.uPlanePx, planeW, planeH);
    gl.uniform1f(uni.uRadiusPx, radius);
    gl.uniform1f(uni.uTiltZ, theta);
    gl.uniform1f(uni.uSkewY, Math.tan(skew * 0.6));
    gl.uniform1f(uni.uRadius, R);
    gl.uniform1f(uni.uPersp, H * 2.2);
    gl.uniform1f(uni.uBoxA, planeW / planeH);
    gl.uniform1f(uni.uTime, t);
    gl.uniform1f(uni.uAmp, distortion);
    gl.uniform1f(uni.uChroma, chroma);
    gl.uniform1f(uni.uVel, vel * 0.03);
    gl.uniform1f(uni.uTint, tint);
    for (const d of draws) {
      gl.uniform1f(uni.uAngle, -d.imgOff / R);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, d.tex.tex);
      gl.uniform1i(uni.uTex, 0);
      gl.uniform1f(uni.uImgA, d.tex.aspect);
      gl.drawArrays(gl.TRIANGLES, 0, vertCount);
    }

    // hysteresis: only switch when clearly closer, kills midpoint flicker
    if (best !== active && bestDist < Math.abs(active * step - s) - step * 0.15) setActive(best);

    if (inView) raf = requestAnimationFrame(frame);
    else running = false;
  };
  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (inView) start();
      },
      { threshold: 0 }
    ).observe(root);
  }
  start();
  window.addEventListener("resize", resize);
  void raf;
}

import { reducedMotion } from "./lib";

/**
 * Footer background: WebGL re-creation of Framer's "Liquid Gradient" shader with
 * the instance settings (5 colour stops, seed 412, speed 1.8, scale 0.8,
 * turbulence 0.5 / 0.35 / 7 octaves, wave frequency 3.2, bias -0.2, exposure
 * 1.1, contrast 1.1, saturation 1.4, 5% dither, soft cursor push). Renders at
 * half resolution and only while on screen. Reduced motion: one still frame.
 */
const VERT = `attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uC0, uC1, uC2, uC3, uC4;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + 412.0) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 7; i++) { v += a * noise(p); p = p * 2.0 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
vec3 grad(float t){
  t = clamp(t, 0.0, 1.0) * 4.0;
  vec3 c = mix(uC0, uC1, clamp(t, 0.0, 1.0));
  c = mix(c, uC2, clamp(t - 1.0, 0.0, 1.0));
  c = mix(c, uC3, clamp(t - 2.0, 0.0, 1.0));
  c = mix(c, uC4, clamp(t - 3.0, 0.0, 1.0));
  return c;
}
void main(){
  float aspect = uRes.x / uRes.y;
  vec2 uv = vec2(vUv.x * aspect, vUv.y) * 0.8;
  float t = uTime * 0.18;
  vec2 m = vec2(uMouse.x * aspect, uMouse.y) * 0.8;
  vec2 d = uv - m;
  uv += normalize(d + 1e-4) * 0.1 * exp(-dot(d, d));
  vec2 q = vec2(fbm(uv * 0.35 + t * 0.3), fbm(uv * 0.35 - t * 0.2 + 3.1));
  vec2 w = uv + q * 1.0;
  float band = sin((w.x * 0.6 + w.y * 1.2) * 3.2 + t * 1.5);
  float v = 0.5 + 0.5 * band - 0.1;
  vec3 col = grad(v);
  col *= 1.1;
  col = (col - 0.5) * 1.1 + 0.5;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, 1.4);
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.05;
  col *= smoothstep(1.05, 0.35, vUv.y);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const COLORS: [number, number, number][] = [
  [245 / 255, 121 / 255, 74 / 255],
  [245 / 255, 96 / 255, 120 / 255],
  [233 / 255, 86 / 255, 154 / 255],
  [154 / 255, 95 / 255, 208 / 255],
  [90 / 255, 78 / 255, 200 / 255],
];

export function initShader(canvas: HTMLCanvasElement) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gl: any = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return;
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u("uRes");
  const uTime = u("uTime");
  const uMouse = u("uMouse");
  ["uC0", "uC1", "uC2", "uC3", "uC4"].forEach((n, i) => gl.uniform3f(u(n), ...COLORS[i]));

  let W = 0;
  let H = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    W = canvas.clientWidth || 1;
    H = canvas.clientHeight || 1;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const calm = reducedMotion();
  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  if (!calm) {
    window.addEventListener(
      "mousemove",
      (e) => {
        const r = canvas.getBoundingClientRect();
        mouse.tx = (e.clientX - r.left) / r.width;
        mouse.ty = 1 - (e.clientY - r.top) / r.height;
      },
      { passive: true }
    );
  }

  const draw = (time: number) => {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  window.addEventListener("resize", () => {
    resize();
    if (calm) draw(0);
  });
  if (calm) {
    draw(0);
    return;
  }

  let raf = 0;
  let running = false;
  const t0 = performance.now();
  const frame = () => {
    if (!running) return;
    if (W !== canvas.clientWidth || H !== canvas.clientHeight) resize();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    draw((performance.now() - t0) / 1000);
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(
    (entries) => {
      const vis = entries[0]?.isIntersecting ?? true;
      if (vis && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!vis) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0 }
  ).observe(canvas);
}

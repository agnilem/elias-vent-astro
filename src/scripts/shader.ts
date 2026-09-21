import { reducedMotion } from "./lib";

/**
 * Footer background: Framer's "Liquid Gradient" shader (WebGL2) with
 * the instance settings (5 colour stops, seed 412, speed 1.8, scale 0.8,
 * turbulence 0.5 / 0.35 / 7 octaves, wave frequency 3.2, bias -0.2, exposure
 * 1.1, contrast 1.1, saturation 1.4, 5% dither, soft cursor push). Renders at
 * half resolution and only while on screen. Reduced motion: one still frame.
 */
const VERT = `#version 300 es
in vec2 aPos; out vec2 v_uv; void main(){ v_uv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
// Fragment shader copied from Framer's own "Liquid Gradient" shader (the mouse
// push buffer is replaced by a single eased offset uniform).
const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time, u_pixelRatio, u_loop, u_speed, u_seed, u_scale, u_turbAmp, u_turbFreq, u_turbIter, u_waveFreq, u_distBias, u_jellify, u_dither, u_ditherMode, u_exposure, u_contrast, u_saturation;
uniform vec2 u_push;
uniform vec4 u_colors[5];
uniform int u_colors_length;

// === CONSTANTS ===
const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

// === PCG hash - https://www.jcgt.org/published/0009/03/02/
uvec3 hash3(uvec3 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    return v;
}

// Seed
vec3 seedRandom(float seedVal) {
    uvec3 s = uvec3(
        floatBitsToUint(seedVal),
        floatBitsToUint(seedVal * 1.5 + 7.31),
        floatBitsToUint(seedVal * 2.7 + 13.37)
    );
    s = hash3(s);
    return vec3(s) / float(0xFFFFFFFFu);
}

// === COLOR SPACE UTILITIES ===
vec3 toLinear(vec3 c) {
    return pow(c, vec3(2.2));
}

vec3 toSrgb(vec3 c) {
    return pow(clamp(c, 0.0, 1.0), vec3(0.4545));
}

vec3 linearToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
    
    l = pow(max(l, 0.0), 1.0/3.0);
    m = pow(max(m, 0.0), 1.0/3.0);
    s = pow(max(s, 0.0), 1.0/3.0);
    
    return vec3(
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    );
}

vec3 oklabToLinear(vec3 c) {
    float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
    
    l = l * l * l;
    m = m * m * m;
    s = s * s * s;
    
    return vec3(
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 oklabToLch(vec3 lab) {
    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
    return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
    vec3 lch0 = oklabToLch(lab0);
    vec3 lch1 = oklabToLch(lab1);
    
    if (lch0.y < 0.05) lch0.z = lch1.z;
    if (lch1.y < 0.05) lch1.z = lch0.z;
    
    float dh = lch1.z - lch0.z;
    if (dh > 3.14159265) dh -= 6.28318530;
    if (dh < -3.14159265) dh += 6.28318530;
    
    return lchToOklab(vec3(
        mix(lch0.x, lch1.x, t),
        mix(lch0.y, lch1.y, t),
        lch0.z + dh * t
    ));
}

// === PALETTE SAMPLING ===
vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
    int safeIdx = clamp(idx, 0, u_colors_length - 1);
    return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
    if (count < 1) return vec3(0.0);
    if (count < 2) return toLinear(getColor(0));
    
    float segmentSize = 1.0 / float(count - 1);
    t = clamp(t, 0.0, 1.0);
    int idx = min(int(floor(t / segmentSize)), count - 2);
    float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);
    
    vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
    vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));
    
    return oklabToLinear(mixLch(lab0, lab1, localT));
}

// === DITHER ===
float IGN(vec2 uv) {
    return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

float quickNoise(vec2 I) {
    return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453);
}

// Dither Mode: 0=Off, 1=IGN, 2=quickNoise
float getDither(vec2 I, float mode) {
    if (mode < 0.5) return 0.5;          // 0: Off
    if (mode < 1.5) return IGN(I);       // 1: Smooth
    return quickNoise(I);                // 2: Grain
}

// === POST-PROCESS ===
vec3 softGamutMap(vec3 linearRgb) {
    float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));
    float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));
    
    if (minC >= 0.0 && maxC <= 1.0) return linearRgb;
    
    vec3 lab = linearToOklab(max(linearRgb, 0.0));
    float L = clamp(lab.x, 0.0, 1.0);
    float C = length(lab.yz);
    float h = atan(lab.z, lab.y);
    
    float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));
    
    if (C > maxChroma * 0.7) {
        float knee = maxChroma * 0.7;
        C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
    }
    
    return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);
}

vec3 applyContrastSaturation(vec3 linearRgb, float contrast, float saturation) {
    vec3 lab = linearToOklab(linearRgb);
    float C = length(lab.yz);
    float h = atan(lab.z, lab.y);
    
    lab.x = clamp((lab.x - 0.5) * contrast + 0.5, 0.0, 1.0);
    C *= saturation;
    lab.y = C * cos(h);
    lab.z = C * sin(h);
    
    return oklabToLinear(lab);
}

// === MAIN ===
void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 r = u_resolution;
    vec2 p = (fragCoord * 2.0 - r) / r.y;
    
    int colorCount = u_colors_length;
    
    // Early out: no colors -> black
    if (colorCount < 1) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float t = u_time * 0.3;
    
    // Map time onto a circle so animation seamlessly wraps.
    float looping = step(0.5, u_loop);
    float phase = TAU * u_time / max(u_loop, 0.01);
    float radius = u_loop * u_speed * 0.3 / TAU;
    float tA = sin(phase) * radius;
    float tB = (1.0 - cos(phase)) * radius;
    
    // Seed-based offsets
    vec3 seedOffset = seedRandom(u_seed);
    vec3 seedOffset2 = seedRandom(u_seed + 100.0);
    
    // Golden angle rotation
    float seedAngle = u_seed * GOLDEN_ANGLE;
    vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;
    
    // Seed-based rotation
    float cs = cos(seedAngle);
    float sn = sin(seedAngle);
    mat2 rot = mat2(cs, -sn, sn, cs);
    p = rot * p;

    // === MOUSE PUSH ===
    // Displace the domain by the accumulated push field so the pattern
    // drags in the direction the cursor moved, then relaxes as it decays.
    vec2 pushField = u_push;
    p -= rot * pushField * 2.0;
    
    // Get dither value
    float dither = getDither(floor(fragCoord / u_pixelRatio), u_ditherMode);
    
    // === TURBULENCE ===
    float totalVal = 0.0;
    float totalWeight = 0.0;
    int turbIter = int(u_turbIter);
    
    float freq = 1.0 / max(u_turbFreq, 0.01);
    
    for (float i = 0.0; i < 4.0; i++) {
        float eph = i / 4.0;
       
        vec2 q = p * u_scale;
        float sq = eph * eph;
        
        if (u_jellify > 0.5) {
            q.yx *= mix(1.0, 0.5, 1.0 - exp(-sq));
        }
        
        float a = seedPhase.x;
        float d = seedPhase.y;
        
        for (int j = 2; j < 13; j++) {
            if (j >= turbIter) break;
            float fj = float(j);
            // When looping, use circular time. Otherwise original t.
            float t1 = mix(t * u_speed, tA, looping);
            float t2 = mix(t * u_speed, tB, looping);
            q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;
            a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z + t2 * 0.3 * looping);
            d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y + t2 * 0.3 * looping);
        }
        
        float v = 0.5 + 0.5 * sin(length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + i * i + seedOffset.x);
        float weight = smoothstep(0.0, 0.5, eph) * smoothstep(1.0, 0.5, eph);
        totalVal += v * weight;
        totalWeight += weight;
    }
    
    float val = totalVal / totalWeight;
    val = clamp((val - 0.3) / 0.4, 0.0, 1.0);
    val = pow(val, exp(-u_distBias));
    val = clamp(val + (dither - 0.5) * u_dither, 0.0, 1.0);
    
    vec3 col = paletteN(val, colorCount);
    col *= u_exposure;
    col = applyContrastSaturation(col, u_contrast, u_saturation);
    col = softGamutMap(col);
    col = toSrgb(col);
    
    fragColor = vec4(col, 1.0);
}
`;

const COLORS: [number, number, number][] = [
  [245 / 255, 121 / 255, 74 / 255],
  [245 / 255, 96 / 255, 120 / 255],
  [233 / 255, 86 / 255, 154 / 255],
  [154 / 255, 95 / 255, 208 / 255],
  [90 / 255, 78 / 255, 200 / 255],
];

export function initShader(canvas: HTMLCanvasElement) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gl: any = canvas.getContext("webgl2", { antialias: false, alpha: false });
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
  // Instance settings from the Framer footer shader.
  const SETTINGS: Record<string, number> = {
    u_loop: 0, u_speed: 1.8, u_seed: 412, u_scale: 0.8, u_turbAmp: 0.5, u_turbFreq: 0.35, u_turbIter: 7,
    u_waveFreq: 3.2, u_distBias: -0.2, u_jellify: 1, u_dither: 0.05, u_ditherMode: 1, u_exposure: 1.1,
    u_contrast: 1.1, u_saturation: 1.4,
  };
  for (const k in SETTINGS) gl.uniform1f(u(k), SETTINGS[k]);
  gl.uniform4fv(u("u_colors"), new Float32Array(COLORS.flatMap((c) => [...c, 1])));
  gl.uniform1i(u("u_colors_length"), COLORS.length);
  const uRes = u("u_resolution");
  const uTime = u("u_time");
  const uPush = u("u_push");
  const uPR = u("u_pixelRatio");

  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    W = canvas.clientWidth || 1;
    H = canvas.clientHeight || 1;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const calm = reducedMotion();
  // Cursor push: the pattern drags with the pointer's movement, then relaxes.
  const push = { x: 0, y: 0 };
  let last: { x: number; y: number } | null = null;
  if (!calm) {
    window.addEventListener(
      "mousemove",
      (e) => {
        const r = canvas.getBoundingClientRect();
        if (e.clientY < r.top || e.clientY > r.bottom) { last = null; return; }
        const x = e.clientX / r.height, y = -(e.clientY - r.top) / r.height;
        if (last) { push.x += (x - last.x) * 0.1; push.y += (y - last.y) * 0.1; }
        last = { x, y };
      },
      { passive: true }
    );
  }

  const draw = (time: number) => {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uPR, dpr);
    gl.uniform2f(uPush, push.x, push.y);
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
    push.x *= 0.96;
    push.y *= 0.96;
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

/**
 * The Glisp orb (SPEC-275, after the owner's reference): one dark glass marble
 * lit from within — fog, dust, orbital rings, a red core — whose insides change
 * with the line: a slow ribbon at rest, braids of filaments while listening, a
 * spiral into the core while thinking, a fan out of it while speaking. Every
 * state is a layer with a weight; the weights ease so a change never pops.
 *
 * Pure: the geometry, the weights and the motion are plain functions the tests
 * cover; `drawSphere` paints one frame on a canvas. Logical space is 600 × 600
 * with the ball at the centre; the drawer scales to the canvas.
 */

import type { VoiceState } from "@/lib/voice-turn";

export const CENTRE = 300;
export const RADIUS = 246;

export type SphereTone = "light" | "dark";
export type LayerKey = "idle" | "listening" | "thinking" | "speaking";
export type Weights = Record<LayerKey, number>;

/** How long a change of state takes to cross-fade, in seconds. */
export const CROSSFADE_SECONDS = 0.45;

const VIOLET = "#7c3aed";
const VIOLET_400 = "#a78bfa";
const VIOLET_500 = "#8b5cf6";
const BLUE_400 = "#60a5fa";

/** What the stage changes about the drawing — and nothing else. */
export interface SpherePalette {
  /** The shadow under the marble (light stage only). */
  shadow: number;
  /** The halo's strength. */
  halo: number;
  /** The rim's strength. */
  rim: number;
}

const PALETTES: Record<SphereTone, SpherePalette> = {
  light: { shadow: 0.34, halo: 0.2, rim: 0.7 },
  dark: { shadow: 0, halo: 0.34, rim: 0.55 },
};

export function paletteFor(tone: SphereTone): SpherePalette {
  return PALETTES[tone];
}

// ── weights ──────────────────────────────────────────────────────────────────

/** The layer a state shows. `connecting` is the idle sphere. */
export function layerFor(state: VoiceState): LayerKey {
  if (state === "listening" || state === "thinking" || state === "speaking") return state;
  return "idle";
}

export function targetWeights(state: VoiceState): Weights {
  const layer = layerFor(state);
  return {
    idle: layer === "idle" ? 1 : 0,
    listening: layer === "listening" ? 1 : 0,
    thinking: layer === "thinking" ? 1 : 0,
    speaking: layer === "speaking" ? 1 : 0,
  };
}

/** Move `current` toward `target` by `dt` seconds of the crossfade — an ease-out
 * that settles in about CROSSFADE_SECONDS and never overshoots. */
export function easeWeights(current: Weights, target: Weights, dt: number, seconds = CROSSFADE_SECONDS): Weights {
  const k = 1 - Math.exp((-4.6 * Math.max(0, dt)) / seconds);
  const next = { ...current };
  for (const key of Object.keys(next) as LayerKey[]) {
    const to = target[key];
    const value = next[key] + (to - next[key]) * k;
    next[key] = Math.abs(value - to) < 0.004 ? to : value;
  }
  return next;
}

// ── motion ───────────────────────────────────────────────────────────────────

export interface Motion {
  /** The pace of the drift — the clock is integrated with it. */
  speed: number;
  /** How far the braids sway with the signal. */
  sway: number;
  /** How bright the insides run. */
  bright: number;
}

export function motionFor(state: VoiceState, level: number): Motion {
  const live = Math.max(0, Math.min(1, level));
  switch (state) {
    case "listening":
      return { speed: 1 + 0.6 * live, sway: 0.7 + 0.9 * live, bright: 0.85 + 0.25 * live };
    case "thinking":
      return { speed: 1.9, sway: 0.55, bright: 1 };
    case "speaking":
      return { speed: 1.4 + 0.4 * live, sway: 0.8 + 1.2 * live, bright: 1 + 0.2 * live };
    case "connecting":
      return { speed: 0.7, sway: 0.4, bright: 0.75 };
    default:
      return { speed: 0.55, sway: 0.35, bright: 0.7 };
  }
}

// ── geometry ─────────────────────────────────────────────────────────────────

/** A small deterministic generator so the orb is the same orb every time. */
export function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A braid's centre line: two cubic segments joined at (mx, my), in logical units. */
export type Curve = readonly [number, number, number, number, number, number, number, number, number, number, number, number];

export interface Filament {
  /** Vertical offset of the filament in the braid. */
  o: number;
  o2: number;
  width: number;
  alpha: number;
  /** 0 = the violet→blue gradient, 1 = violet 400, 2 = blue 400, 3 = violet 500. */
  colour: 0 | 1 | 2 | 3;
}

export function filaments(seed: number, count: number, spread: number): Filament[] {
  const r = rng(seed);
  const out: Filament[] = [];
  for (let i = 0; i < count; i++) {
    const o = (r() - 0.5) * spread;
    const o2 = (r() - 0.5) * spread * 0.7;
    const width = 1.1 + r() * 4.2;
    const alpha = 0.16 + r() * 0.4;
    const pick = r();
    const colour: Filament["colour"] = pick < 0.5 ? 0 : pick < 0.7 ? 1 : pick < 0.85 ? 2 : 3;
    out.push({ o, o2, width, alpha, colour });
  }
  return out;
}

type Pt = readonly [number, number];

/** A point on a cubic. */
export function pointOnCubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): [number, number] {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** Where the spark is along a braid's centre line, `u` in 0..1. */
export function pointOnCurve(c: Curve, u: number): [number, number] {
  const [x0, y0, c1x, c1y, c2x, c2y, mx, my, c3x, c3y, x1, y1] = c;
  if (u < 0.5) return pointOnCubic([x0, y0], [c1x, c1y], [c2x, c2y], [mx, my], u * 2);
  // the second segment mirrors the first's last control point (an SVG "S")
  return pointOnCubic([mx, my], [2 * mx - c2x, 2 * my - c2y], [c3x, c3y], [x1, y1], (u - 0.5) * 2);
}

/** The points of a logarithmic spiral into the centre, `dir` ±1, in logical units. */
export function spiralPoints(turns: number, a0: number, scale: number, dir: 1 | -1, steps = 60): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = a0 + dir * t * turns * Math.PI * 2;
    const rad = 18 + t * scale;
    out.push([CENTRE + Math.cos(ang) * rad, CENTRE + Math.sin(ang) * rad * 0.82]);
  }
  return out;
}

export interface FanBlade {
  /** The cubic from the core to the glass, in logical units. */
  c1: [number, number];
  c2: [number, number];
  end: [number, number];
  width: number;
  alpha: number;
  colour: 0 | 1 | 3;
}

/** The blades of one side of the speaking fan: from the core, bowing out past
 * their landing, to the glass. `dir` −1 = left, 1 = right. */
export function fanBlades(seed: number, dir: 1 | -1, count = 30): FanBlade[] {
  const r = rng(seed);
  const out: FanBlade[] = [];
  for (let i = 0; i < count; i++) {
    const y = CENTRE + (i - (count - 1) / 2) * 15.6 + (r() - 0.5) * 12;
    const x = CENTRE + dir * 252;
    const bend = CENTRE + (y - CENTRE) * 1.35;
    out.push({
      c1: [CENTRE + dir * 96, CENTRE + (y - CENTRE) * 0.15],
      c2: [CENTRE + dir * 180, bend],
      end: [x, y],
      width: 1.1 + r() * 3,
      alpha: 0.22 + r() * 0.45,
      colour: i % 3 === 0 ? 0 : i % 2 ? 1 : 3,
    });
  }
  return out;
}

export interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  alpha: number;
}

export function dust(seed: number, count = 40): Star[] {
  const r = rng(seed);
  const out: Star[] = [];
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * RADIUS * 0.95;
    out.push({ x: CENTRE + Math.cos(a) * d, y: CENTRE + Math.sin(a) * d, r: 0.7 + r() * 1.8, phase: r() * Math.PI * 2, alpha: 0.2 + r() * 0.5 });
  }
  return out;
}

export function constellation(seed: number, count = 14): Array<[number, number]> {
  const r = rng(seed);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = 60 + r() * 168;
    out.push([CENTRE + Math.cos(a) * d, CENTRE + Math.sin(a) * d * 0.85]);
  }
  return out;
}

// ── the fixed geometry, built once ───────────────────────────────────────────

const BRAID_FRONT: Curve[] = [
  [48, 276, 144, 132, 240, 420, 300, 300, 492, 168, 564, 264],
  [36, 324, 144, 468, 252, 180, 300, 300, 480, 420, 564, 336],
  [84, 132, 240, 156, 180, 372, 300, 300, 420, 432, 528, 420],
];
const BRAID_BACK: Curve[] = [
  [48, 348, 156, 240, 240, 456, 330, 336, 504, 264, 564, 324],
  [60, 180, 180, 420, 264, 144, 336, 264, 480, 468, 552, 216],
];
const IDLE_CURVE: Curve = [48, 300, 156, 204, 240, 396, 300, 300, 468, 180, 564, 300];

const FRONT = BRAID_FRONT.map((_, i) => filaments(3 + i * 7, [32, 28, 20][i], [84, 84, 60][i]));
const BACK = BRAID_BACK.map((_, i) => filaments(21 + i * 5, [22, 18][i], [84, 72][i]));
const IDLE = filaments(5, 6, 36);
interface Arm {
  pts: Array<[number, number]>;
  width: number;
  alpha: number;
  colour: 0 | 1 | 2 | 3;
}
const SPIRAL_FRONT: Arm[] = Array.from({ length: 40 }, (_, i) => {
  const r = rng(101 + i);
  return { pts: spiralPoints(1.6 + r() * 0.8, r() * Math.PI * 2, 216 + r() * 48, 1), width: 1.1 + r() * 3.6, alpha: 0.18 + r() * 0.4, colour: i % 4 === 0 ? 0 : i % 2 ? 1 : 2 };
});
const SPIRAL_BACK: Arm[] = Array.from({ length: 24 }, (_, i) => {
  const r = rng(301 + i);
  return { pts: spiralPoints(1.4 + r() * 0.6, r() * Math.PI * 2, 240 + r() * 48, -1), width: 1.2 + r() * 3, alpha: 0.15 + r() * 0.25, colour: i % 3 ? 3 : 2 };
});
const FAN_LEFT = fanBlades(31, -1);
const FAN_RIGHT = fanBlades(37, 1);
const DUST = dust(7);
const NODES = constellation(23);

// ── drawing ──────────────────────────────────────────────────────────────────

function colourFor(ctx: CanvasRenderingContext2D, colour: number, from: Pt, to: Pt, s: number): string | CanvasGradient {
  if (colour === 0) {
    const g = ctx.createLinearGradient(from[0] * s, from[1] * s, to[0] * s, to[1] * s);
    g.addColorStop(0, "#c084fc");
    g.addColorStop(0.35, VIOLET);
    g.addColorStop(0.65, "#4f46e5");
    g.addColorStop(1, "#38bdf8");
    return g;
  }
  if (colour === 1) return VIOLET_400;
  if (colour === 2) return BLUE_400;
  return VIOLET_500;
}

function traceBraid(ctx: CanvasRenderingContext2D, c: Curve, f: { o: number; o2: number }, s: number): void {
  const [x0, y0, c1x, c1y, c2x, c2y, mx, my, c3x, c3y, x1, y1] = c;
  const my2 = my + f.o * 0.12;
  const c2y2 = c2y + f.o;
  ctx.beginPath();
  ctx.moveTo(x0 * s, (y0 + f.o) * s);
  ctx.bezierCurveTo(c1x * s, (c1y + f.o2) * s, c2x * s, c2y2 * s, mx * s, my2 * s);
  ctx.bezierCurveTo((2 * mx - c2x) * s, (2 * my2 - c2y2) * s, c3x * s, (c3y + f.o2) * s, x1 * s, (y1 + f.o) * s);
}

/** Rotate + stretch about the centre — the braids' sway, the fan's breath. */
function about(ctx: CanvasRenderingContext2D, s: number, angle: number, stretch: number, draw: () => void): void {
  ctx.save();
  ctx.translate(CENTRE * s, CENTRE * s);
  ctx.rotate(angle);
  ctx.scale(1, stretch);
  ctx.translate(-CENTRE * s, -CENTRE * s);
  draw();
  ctx.restore();
}

function drawBraids(ctx: CanvasRenderingContext2D, s: number, clock: number, sway: number, alpha: number, bright: number): void {
  const spark = (c: Curve, u: number, a: number) => {
    const [x, y] = pointOnCurve(c, u);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x * s, y * s, 3.2 * s, 0, Math.PI * 2);
    ctx.fill();
  };
  // the far braids, seen through the glass
  BRAID_BACK.forEach((c, i) => {
    const ph = clock / 6.5 + i * 0.5;
    const wave = Math.sin(ph * Math.PI * 2);
    about(ctx, s, wave * 0.07 * sway, 1 + 0.06 * sway * (0.5 + 0.5 * wave), () => {
      for (const f of BACK[i]) {
        ctx.strokeStyle = colourFor(ctx, f.colour, [c[0], c[1]], [c[10], c[11]], s);
        ctx.lineWidth = f.width * 1.6 * s;
        ctx.globalAlpha = alpha * f.alpha * 0.55 * bright;
        traceBraid(ctx, c, f, s);
        ctx.stroke();
      }
    });
  });
  // the near braids, crisp, with a spark travelling each
  const periods = [6.5, 6.5, 5.4];
  const phases = [0, 0.5, 0.22];
  BRAID_FRONT.forEach((c, i) => {
    const ph = clock / periods[i] + phases[i];
    const wave = Math.sin(ph * Math.PI * 2);
    about(ctx, s, wave * 0.07 * sway, 1 + 0.12 * sway * (0.5 + 0.5 * wave), () => {
      for (const f of FRONT[i]) {
        ctx.strokeStyle = colourFor(ctx, f.colour, [c[0], c[1]], [c[10], c[11]], s);
        ctx.lineWidth = f.width * s;
        ctx.globalAlpha = alpha * f.alpha * bright;
        traceBraid(ctx, c, f, s);
        ctx.stroke();
      }
      spark(c, (((clock / 3.6 + i * 0.33) % 1) + 1) % 1, alpha * 0.9 * bright);
    });
  });
}

function drawIdle(ctx: CanvasRenderingContext2D, s: number, clock: number, alpha: number, bright: number): void {
  const wave = Math.sin((clock / 11) * Math.PI * 2);
  about(ctx, s, wave * 0.05, 1 + 0.08 * (0.5 + 0.5 * wave), () => {
    IDLE.forEach((f, i) => {
      ctx.strokeStyle = i % 2 ? VIOLET_400 : VIOLET;
      ctx.lineWidth = f.width * 0.8 * s;
      ctx.globalAlpha = alpha * (0.25 + f.alpha * 0.5) * bright;
      traceBraid(ctx, IDLE_CURVE, f, s);
      ctx.stroke();
    });
  });
}

function drawSpiral(ctx: CanvasRenderingContext2D, s: number, clock: number, alpha: number, bright: number): void {
  const poly = (pts: Array<[number, number]>) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
  };
  about(ctx, s, (-clock / 14) * Math.PI * 2, 1, () => {
    for (const sp of SPIRAL_BACK) {
      ctx.strokeStyle = colourFor(ctx, sp.colour, sp.pts[0], sp.pts[sp.pts.length - 1], s);
      ctx.lineWidth = sp.width * 1.4 * s;
      ctx.globalAlpha = alpha * sp.alpha * 0.7 * bright;
      poly(sp.pts);
      ctx.stroke();
    }
  });
  about(ctx, s, (-clock / 60) * Math.PI * 2, 1, () => {
    ctx.strokeStyle = "rgba(196,181,253,.35)";
    ctx.lineWidth = 1.5 * s;
    ctx.globalAlpha = alpha * bright;
    NODES.forEach((n, i) => {
      const m = NODES[(i + 1) % NODES.length];
      const k = NODES[(i + 5) % NODES.length];
      ctx.beginPath();
      ctx.moveTo(n[0] * s, n[1] * s);
      ctx.lineTo(m[0] * s, m[1] * s);
      if (i % 2) {
        ctx.moveTo(n[0] * s, n[1] * s);
        ctx.lineTo(k[0] * s, k[1] * s);
      }
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(233,229,255,.85)";
    for (const n of NODES) {
      ctx.beginPath();
      ctx.arc(n[0] * s, n[1] * s, 3.3 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  about(ctx, s, (clock / 9) * Math.PI * 2, 1, () => {
    for (const sp of SPIRAL_FRONT) {
      ctx.strokeStyle = colourFor(ctx, sp.colour, sp.pts[0], sp.pts[sp.pts.length - 1], s);
      ctx.lineWidth = sp.width * s;
      ctx.globalAlpha = alpha * sp.alpha * bright;
      poly(sp.pts);
      ctx.stroke();
    }
  });
}

function drawFan(ctx: CanvasRenderingContext2D, s: number, clock: number, level: number, alpha: number, bright: number): void {
  const sides: Array<[FanBlade[], number, 1 | -1]> = [
    [FAN_LEFT, 0, -1],
    [FAN_RIGHT, 0.5, 1],
  ];
  for (const [blades, phase, dir] of sides) {
    const breath = 0.5 + 0.5 * Math.sin((clock / 1.1 + phase) * Math.PI * 2);
    about(ctx, s, 0, 1 + 0.16 * breath + 0.3 * level, () => {
      for (const b of blades) {
        ctx.strokeStyle = colourFor(ctx, b.colour, [CENTRE, CENTRE], b.end, s);
        ctx.lineWidth = b.width * s;
        ctx.globalAlpha = alpha * b.alpha * bright;
        ctx.beginPath();
        ctx.moveTo(CENTRE * s, CENTRE * s);
        ctx.bezierCurveTo(b.c1[0] * s, b.c1[1] * s, b.c2[0] * s, b.c2[1] * s, b.end[0] * s, b.end[1] * s);
        ctx.stroke();
      }
    });
    // the spark along the middle blade
    const u = (((clock / 3.6 + phase) % 1) + 1) % 1;
    const [x, y] = pointOnCubic([CENTRE, CENTRE], [CENTRE + dir * 96, CENTRE], [CENTRE + dir * 180, CENTRE], [CENTRE + dir * 252, CENTRE], u);
    ctx.globalAlpha = alpha * 0.85 * bright;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x * s, y * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fog(ctx: CanvasRenderingContext2D, s: number, x: number, y: number, rx: number, ry: number, angle: number, rgb: string, a: number): void {
  ctx.save();
  ctx.translate(x * s, y * s);
  ctx.rotate(angle);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * s);
  g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * One frame into a square canvas of `size` CSS pixels. `clock` is the flow time
 * in seconds (the component integrates the state's `speed`, so a change of
 * pace never jumps), `weights` the crossfade of the four layers, `level` the
 * live signal 0..1, `tone` the stage the marble sits on.
 */
export function drawSphere(
  ctx: CanvasRenderingContext2D,
  size: number,
  clock: number,
  weights: Weights,
  level: number,
  tone: SphereTone = "light",
  state: VoiceState = "idle",
): void {
  const s = size / 600;
  const cx = CENTRE * s;
  const cy = CENTRE * s;
  const R = RADIUS * s;
  const p = paletteFor(tone);
  const { sway, bright } = motionFor(state, level);
  const live = Math.max(0, Math.min(1, level));
  ctx.clearRect(0, 0, size, size);
  ctx.lineCap = "round";

  // the shadow on the stage (light), and the halo
  if (p.shadow > 0) {
    ctx.save();
    ctx.translate(cx, cy + R * 1.06);
    ctx.scale(1, 0.22);
    const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.8);
    sh.addColorStop(0, `rgba(76,29,149,${p.shadow})`);
    sh.addColorStop(0.5, `rgba(124,58,237,${p.shadow * 0.35})`);
    sh.addColorStop(1, "rgba(124,58,237,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const breath = 0.5 + 0.5 * Math.sin((clock / 4.2) * Math.PI * 2);
  const haloR = R * (1.28 + 0.08 * breath);
  const halo = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, haloR);
  halo.addColorStop(0, `rgba(124,58,237,${(p.halo + 0.1 * live) * bright})`);
  halo.addColorStop(0.55, `rgba(59,130,246,${p.halo * 0.35 * bright})`);
  halo.addColorStop(1, "rgba(124,58,237,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // the marble: a deep interior, lit from within
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const body = ctx.createRadialGradient(cx - R * 0.24, cy - R * 0.4, 0, cx, cy, R * 1.44);
  body.addColorStop(0, "rgba(59,42,122,.96)");
  body.addColorStop(0.5, "rgba(29,22,80,.97)");
  body.addColorStop(0.85, "rgba(13,10,44,.98)");
  body.addColorStop(1, "rgba(6,5,26,1)");
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, size, size);

  // everything inside adds light
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 1;
  fog(ctx, s, 252, 228, 192, 120, Math.sin((clock / 14) * Math.PI * 2) * 0.3, "124,58,237", 0.42 * bright);
  fog(ctx, s, 372, 384, 180, 108, -Math.sin((clock / 19) * Math.PI * 2) * 0.3, "59,130,246", 0.36 * bright);
  fog(ctx, s, 300, 300, 108, 144, 0, "228,40,40", 0.16 + 0.1 * weights.speaking);

  // the dust
  ctx.fillStyle = "#ffffff";
  for (const d of DUST) {
    ctx.globalAlpha = d.alpha * (0.35 + 0.65 * Math.abs(Math.sin(clock * 1.2 + d.phase)));
    ctx.beginPath();
    ctx.arc(d.x * s, d.y * s, d.r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // the orbital rings
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((clock / 40) * Math.PI * 2);
  ctx.setLineDash([3.6 * s, 13 * s]);
  ctx.lineWidth = 2 * s;
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = "rgba(196,181,253,.5)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 228 * s, 72 * s, -0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(196,181,253,.35)";
  ctx.beginPath();
  ctx.arc(0, 0, 237 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // the layers, cross-faded
  if (weights.idle > 0.01) drawIdle(ctx, s, clock, weights.idle, bright);
  if (weights.listening > 0.01) drawBraids(ctx, s, clock, sway, weights.listening, bright);
  if (weights.thinking > 0.01) drawSpiral(ctx, s, clock, weights.thinking, bright);
  if (weights.speaking > 0.01) drawFan(ctx, s, clock, live, weights.speaking, bright);
  ctx.globalAlpha = 1;

  // Glisp's core — the brand's dot at the heart, its bloom wide at rest
  const period = 4 * weights.idle + 2.6 * weights.listening + 1.4 * weights.thinking + 1.1 * weights.speaking || 2.6;
  const pulse = 0.5 + 0.5 * Math.sin((clock / period) * Math.PI * 2);
  const bloomR = (96 + 48 * weights.idle + 24 * weights.speaking + 40 * live) * s;
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
  bloom.addColorStop(0, `rgba(255,92,92,${0.85 * bright})`);
  bloom.addColorStop(0.35, `rgba(228,40,40,${0.45 * bright})`);
  bloom.addColorStop(1, "rgba(228,40,40,0)");
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  const coreR = (25 + 3 * weights.speaking + 6 * live) * (1 + 0.18 * pulse) * s;
  ctx.shadowBlur = 18 * s;
  ctx.shadowColor = "rgba(255,80,80,.9)";
  const core = ctx.createRadialGradient(cx - coreR * 0.2, cy - coreR * 0.24, coreR * 0.1, cx, cy, coreR);
  core.addColorStop(0, "#fff1f1");
  core.addColorStop(0.35, "#ff6b6b");
  core.addColorStop(1, "#c81616");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,120,120,.35)";
  ctx.lineWidth = 3.6 * s;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 1.55, 0, Math.PI * 2);
  ctx.stroke();

  // the glass: the dark limb where the ball turns away, the Fresnel rim
  const limb = ctx.createRadialGradient(cx, cy, R * 0.84, cx, cy, R);
  limb.addColorStop(0, "rgba(0,0,0,0)");
  limb.addColorStop(1, "rgba(0,0,0,.55)");
  ctx.fillStyle = limb;
  ctx.fillRect(0, 0, size, size);
  const fres = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R);
  fres.addColorStop(0, "rgba(196,181,253,0)");
  fres.addColorStop(0.75, `rgba(196,181,253,${0.85 * p.rim})`);
  fres.addColorStop(1, "rgba(255,255,255,.2)");
  ctx.fillStyle = fres;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  // the reflections on the glass
  ctx.save();
  ctx.translate(216 * s, 156 * s);
  ctx.rotate(-0.38);
  const spec = ctx.createRadialGradient(0, 0, 0, 0, 0, 90 * s);
  spec.addColorStop(0, "rgba(255,255,255,.55)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.ellipse(0, 0, 90 * s, 45 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 8.4 * s;
  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.beginPath();
  ctx.moveTo(108 * s, 264 * s);
  ctx.bezierCurveTo(120 * s, 180 * s, 174 * s, 120 * s, 252 * s, 96 * s);
  ctx.stroke();
  ctx.lineWidth = 6 * s;
  ctx.strokeStyle = "rgba(196,181,253,.6)";
  ctx.beginPath();
  ctx.moveTo(180 * s, 492 * s);
  ctx.bezierCurveTo(246 * s, 528 * s, 354 * s, 528 * s, 420 * s, 492 * s);
  ctx.stroke();
  ctx.lineWidth = 4.2 * s;
  ctx.strokeStyle = `rgba(167,139,250,${p.rim})`;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
}

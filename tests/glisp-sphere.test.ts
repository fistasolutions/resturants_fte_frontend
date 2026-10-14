import { describe, expect, it } from "vitest";

import {
  CENTRE,
  CROSSFADE_SECONDS,
  constellation,
  dust,
  easeWeights,
  fanBlades,
  filaments,
  layerFor,
  motionFor,
  paletteFor,
  pointOnCubic,
  pointOnCurve,
  rng,
  spiralPoints,
  targetWeights,
  type Curve,
} from "@/lib/glisp-sphere";

describe("the orb's states", () => {
  it("maps every voice state to a layer and cross-fades between them without a pop", () => {
    expect(layerFor("idle")).toBe("idle");
    expect(layerFor("connecting")).toBe("idle");
    expect(layerFor("listening")).toBe("listening");
    expect(targetWeights("speaking")).toEqual({ idle: 0, listening: 0, thinking: 0, speaking: 1 });
    let w = targetWeights("listening");
    const to = targetWeights("speaking");
    w = easeWeights(w, to, 0.016);
    // one frame in: both layers are visible, the sum stays about one
    expect(w.listening).toBeGreaterThan(0.8);
    expect(w.speaking).toBeGreaterThan(0.05);
    expect(w.listening + w.speaking).toBeCloseTo(1, 1);
    for (let i = 0; i < 40; i++) w = easeWeights(w, to, 0.016);
    // after the crossfade it has settled exactly
    expect(w).toEqual(to);
    expect(easeWeights(to, to, 1)).toEqual(to);
    expect(CROSSFADE_SECONDS).toBeLessThan(0.6);
  });
  it("lets the voice shape the sphere per state", () => {
    expect(motionFor("idle", 0).speed).toBeLessThan(motionFor("listening", 0).speed);
    expect(motionFor("listening", 1).sway).toBeGreaterThan(motionFor("listening", 0).sway);
    expect(motionFor("thinking", 0.9).speed).toBe(1.9);
    expect(motionFor("speaking", 1).bright).toBeGreaterThan(motionFor("idle", 0).bright);
  });
  it("draws itself for the stage it is on", () => {
    expect(paletteFor("light").shadow).toBeGreaterThan(0);
    expect(paletteFor("dark").shadow).toBe(0);
    expect(paletteFor("dark").halo).toBeGreaterThan(paletteFor("light").halo);
  });
});

describe("the orb's geometry", () => {
  it("is the same orb every time", () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(filaments(3, 5, 80)).toEqual(filaments(3, 5, 80));
    expect(fanBlades(31, -1)).toEqual(fanBlades(31, -1));
    expect(dust(7)).toEqual(dust(7));
    expect(constellation(23)).toEqual(constellation(23));
  });
  it("keeps the filaments inside their braid and the fan inside the glass", () => {
    const fs = filaments(3, 40, 84);
    expect(fs).toHaveLength(40);
    expect(fs.every((f) => Math.abs(f.o) <= 42 && f.width > 1 && f.alpha > 0.15 && f.alpha < 0.57)).toBe(true);
    const left = fanBlades(31, -1);
    expect(left).toHaveLength(30);
    expect(left.every((b) => b.end[0] === CENTRE - 252 && b.c1[0] === CENTRE - 96)).toBe(true);
    expect(fanBlades(37, 1).every((b) => b.end[0] === CENTRE + 252)).toBe(true);
    expect(dust(7).every((d) => Math.hypot(d.x - CENTRE, d.y - CENTRE) <= 246 * 0.95 + 1e-9)).toBe(true);
  });
  it("spirals into the core and walks a point along a curve", () => {
    const pts = spiralPoints(1.5, 0, 240, 1, 30);
    expect(pts).toHaveLength(31);
    expect(pts[0]).toEqual([CENTRE + 18, CENTRE]);
    const far = Math.hypot(pts[30][0] - CENTRE, pts[30][1] - CENTRE);
    expect(far).toBeGreaterThan(200);
    expect(pointOnCubic([0, 0], [0, 0], [10, 10], [10, 10], 0.5)).toEqual([5, 5]);
    const c: Curve = [48, 300, 156, 204, 240, 396, 300, 300, 468, 180, 564, 300];
    expect(pointOnCurve(c, 0)).toEqual([48, 300]);
    expect(pointOnCurve(c, 0.5)).toEqual([300, 300]);
    expect(pointOnCurve(c, 1)).toEqual([564, 300]);
  });
});

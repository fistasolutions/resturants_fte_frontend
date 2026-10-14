/**
 * Chart geometry for Finance Oversight (SPEC-301) — pure, so the scales are proven in
 * Vitest rather than eyeballed. Components only draw what these return.
 *
 * One rule both charts keep: every tick label names a value the axis actually reaches,
 * and nothing is drawn outside the plot.
 */

export interface Box {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Round, human tick values spanning [min, max] — 1, 2, 2.5 or 5 × a power of ten. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min];
  const span = max - min;
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => span / s <= count) ?? 10 * power;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

export function scale(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

export interface TrendGeometry {
  owed: string;
  owedArea: string;
  late: string;
  points: { x: number; owedY: number; lateY: number; date: string }[];
  ticks: { value: number; y: number }[];
}

/** Two lines over the snapshot points: what is owed, and what of it is late. */
export function trendGeometry(
  points: { date: string; outstanding: number; pastDue: number }[],
  box: Box,
): TrendGeometry | null {
  if (points.length < 2) return null;
  const ticks = niceTicks(0, Math.max(...points.map((p) => p.outstanding)), 4);
  const top = ticks[ticks.length - 1] || 1;
  const x = scale([0, points.length - 1], [box.left, box.width - box.right]);
  const y = scale([0, top], [box.height - box.bottom, box.top]);
  const placed = points.map((p, i) => ({ x: x(i), owedY: y(p.outstanding), lateY: y(p.pastDue), date: p.date }));
  const path = (key: "owedY" | "lateY") =>
    placed.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p[key].toFixed(1)}`).join("");
  const base = y(0).toFixed(1);
  return {
    owed: path("owedY"),
    owedArea: `${path("owedY")}L${placed[placed.length - 1].x.toFixed(1)},${base}L${placed[0].x.toFixed(1)},${base}Z`,
    late: path("lateY"),
    points: placed,
    ticks: ticks.map((value) => ({ value, y: y(value) })),
  };
}

export interface CashGeometry {
  bars: { week: number; inX: number; outX: number; width: number; inY: number; inH: number; outY: number; outH: number }[];
  line: string;
  dots: { week: number; x: number; y: number; below: boolean }[];
  cushionY: number;
  zeroY: number;
  ticks: { value: number; y: number }[];
  labels: { week: number; x: number }[];
}

/** Takings and bills as paired bars per week, the cash balance as a line starting from
 * today's bank balance, the cushion as a dashed rule. The axis runs below zero only
 * when a week is overdrawn. */
export function cashGeometry(
  weeks: { week: number; takings: number; billsDue: number; balance: number; belowCushion: boolean }[],
  bank: number,
  cushion: number,
  box: Box,
): CashGeometry {
  const values = [bank, cushion, 0, ...weeks.flatMap((w) => [w.takings, w.billsDue, w.balance])];
  const ticks = niceTicks(Math.min(...values), Math.max(...values), 4);
  const y = scale([ticks[0], ticks[ticks.length - 1]], [box.height - box.bottom, box.top]);
  const band = (box.width - box.left - box.right) / Math.max(1, weeks.length);
  const barW = band * 0.34;
  const zero = y(0);
  const cx = (i: number) => box.left + band * i + band / 2;
  const bars = weeks.map((w, i) => {
    const inTop = y(Math.max(0, w.takings));
    const outTop = y(Math.max(0, w.billsDue));
    return {
      week: w.week,
      inX: cx(i) - barW - band * 0.02,
      outX: cx(i) + band * 0.02,
      width: barW,
      inY: inTop,
      inH: Math.max(0, zero - inTop),
      outY: outTop,
      outH: Math.max(0, zero - outTop),
    };
  });
  const dots = weeks.map((w, i) => ({ week: w.week, x: cx(i), y: y(w.balance), below: w.belowCushion }));
  const line = [`M${box.left.toFixed(1)},${y(bank).toFixed(1)}`, ...dots.map((d) => `L${d.x.toFixed(1)},${d.y.toFixed(1)}`)].join("");
  return {
    bars,
    line,
    dots,
    cushionY: y(cushion),
    zeroY: zero,
    ticks: ticks.map((value) => ({ value, y: y(value) })),
    labels: weeks.map((w, i) => ({ week: w.week, x: cx(i) })),
  };
}

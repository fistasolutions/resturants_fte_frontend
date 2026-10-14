import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { PRODUCT } from "@/lib/product";

export const alt = `${PRODUCT.name} — ${PRODUCT.tagline.toLowerCase()}. ${PRODUCT.descriptor}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card every route inherits (SPEC-215; redesigned 2026-09-28 in the identity the
 * owner chose for the login screen, "R5 · Red Band"): the marketing site's paper above a
 * brand-red band, the E logo, the display serif, and the app drawn as a marketing-style window
 * (bars, never numbers — nothing on it pretends to be data).
 *
 * Colours are hardcoded hex, the ONLY place in the app where that is allowed: `ImageResponse`
 * renders through Satori, which does not resolve CSS custom properties. They mirror the
 * `--showcase*` tokens in `app/globals.css`; change them together. Satori also needs an explicit
 * `display: flex` on anything with more than one child. Fonts are read from `assets/og/` (the
 * marketing site's share-card fonts), so rendering never depends on the network.
 */
const PAPER = "#f0eee9"; // --showcase
const INK = "#0e0f12"; // --showcase-foreground
const MUTED = "#65686f"; // --showcase-muted
const LINE = "#e5e2db"; // --showcase-border
const TILE = "#ece8e1"; // --showcase-tile
const CARD = "#ffffff"; // --showcase-card
const RED = "#e42828"; // --showcase-band / --brand
const BLUSH = "#fbe3e1"; // --showcase-band-muted

const KPIS: { label: string; width: number }[] = [
  { label: "NET SALES", width: 78 },
  { label: "ORDERS", width: 54 },
  { label: "AVG ORDER", width: 66 },
  { label: "RETURNS", width: 42 },
];

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <svg width="46" height="46" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="104" fill={INK} />
        <path d="M176 124H338V170H228V220H330V264H228V320H338V366H176Z" fill={PAPER} />
        <rect x="186" y="394" width="140" height="22" rx="11" fill={RED} />
      </svg>
      <span style={{ fontFamily: "Geist", fontSize: 30, color: INK, letterSpacing: -1 }}>commerce</span>
    </div>
  );
}

function DashboardWindow() {
  return (
    <div
      style={{
        position: "absolute",
        left: 560,
        top: 92,
        width: 640,
        height: 400,
        display: "flex",
        flexDirection: "column",
        background: CARD,
        border: `2px solid ${LINE}`,
        borderRight: "none",
        borderRadius: "18px 0 0 18px",
        boxShadow: "0 30px 60px rgba(116,21,24,0.22)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 22px",
          borderBottom: `2px solid ${LINE}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 7 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: LINE }} />
            ))}
          </div>
          <span style={{ fontFamily: "Geist", fontSize: 19, color: INK }}>Good morning</span>
        </div>
        <span style={{ fontFamily: "GeistMono", fontSize: 15, color: MUTED }}>Updated every 15 min</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 22, flexGrow: 1 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: 140,
                padding: 14,
                border: `2px solid ${LINE}`,
                borderRadius: 10,
              }}
            >
              <span style={{ fontFamily: "GeistMono", fontSize: 13, letterSpacing: 1.5, color: MUTED }}>
                {kpi.label}
              </span>
              <div style={{ width: `${kpi.width}%`, height: 14, borderRadius: 4, background: TILE }} />
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: 16,
            border: `2px solid ${LINE}`,
            borderRadius: 10,
          }}
        >
          <span style={{ fontFamily: "GeistMono", fontSize: 13, letterSpacing: 1.5, color: MUTED }}>
            NET SALES · THIS PERIOD VS LAST
          </span>
          <svg width="560" height="148" viewBox="0 0 640 180" style={{ marginTop: 8 }}>
            <polyline
              points="0,156 60,150 120,153 180,136 240,142 300,124 360,130 420,112 480,118 540,102 640,106"
              fill="none"
              stroke="#c9c5bc"
              strokeWidth="3"
              strokeDasharray="7 7"
            />
            <polyline
              points="0,140 60,128 120,134 180,104 240,112 300,84 360,94 420,64 480,74 540,46 640,54"
              fill="none"
              stroke={RED}
              strokeWidth="4"
            />
            <circle cx="540" cy="46" r="7" fill={RED} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default async function OpengraphImage() {
  const font = (name: string) => readFile(join(process.cwd(), "assets/og", name));
  const [serif, sans, mono] = await Promise.all([
    font("Instrument-Serif.ttf"),
    font("Geist-wght-600.ttf"),
    font("Geist-Mono-wght-500.ttf"),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: PAPER }}>
        {/* The brand-red band, the lower half. */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 1200, height: 300, background: RED }} />

        {/* Paper half: the logo and what it is. */}
        <div style={{ position: "absolute", left: 64, top: 56, display: "flex", flexDirection: "column", gap: 26 }}>
          <Logo />
          <span style={{ fontFamily: "GeistMono", fontSize: 17, letterSpacing: 2, color: MUTED }}>
            {`[ ${PRODUCT.descriptor.toUpperCase()} ]`}
          </span>
          <span style={{ fontFamily: "Geist", fontSize: 24, color: INK, lineHeight: 1.35, width: 440 }}>
            Every app your store runs on, side by side — and answers you can trust.
          </span>
        </div>

        {/* Red half: the promise, in the display serif. Two stacked lines: Satori treats a
            nested span as unbreakable. */}
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 58,
            display: "flex",
            flexDirection: "column",
            fontFamily: "InstrumentSerif",
            fontSize: 76,
            lineHeight: 1,
            letterSpacing: -2,
            color: "#ffffff",
          }}
        >
          <span>Your whole store,</span>
          <span>on one screen.</span>
        </div>

        <DashboardWindow />

        <span
          style={{
            position: "absolute",
            right: 48,
            bottom: 52,
            fontFamily: "GeistMono",
            fontSize: 20,
            letterSpacing: 1,
            color: BLUSH,
          }}
        >
          ecommerce.ftes.ai
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "InstrumentSerif", data: serif, weight: 400, style: "normal" },
        { name: "Geist", data: sans, weight: 600, style: "normal" },
        { name: "GeistMono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}

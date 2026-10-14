/**
 * The voice console's frame (SPEC-276): one path whose top edge scoops around
 * the orb and whose bottom bulges into the tab that holds the mic, with soft
 * corners — the owner's reference, drawn at any size without stretching.
 * Pure: numbers in, an SVG path out.
 */

export interface ConsoleShape {
  /** Outer width and height of the frame, in px (the SVG's viewBox). */
  width: number;
  height: number;
  /** The radius of the scoop the orb sits into — the ball's drawn radius plus an
   * even gap — and how far below the top edge its chord sits. */
  scoop: number;
  scoopDepth: number;
  /** The mic tab — a cradle around the coin: the arc's radius (the coin's plus an
   * even gap) and how far the cradle hangs below the frame's bottom edge. The
   * coin's centre sits `tabDepth - tabHalf` below that edge. */
  tabHalf: number;
  tabDepth: number;
  /** Corner radius. */
  corner: number;
  /** Inset from the viewBox edge, so the stroke's glow is not clipped. */
  inset: number;
}

/** The Ask Glisp panel: a 220 px orb over a 416 px console. */
export const CONSOLE_PANEL: ConsoleShape = {
  width: 416,
  height: 456,
  scoop: 98,
  scoopDepth: 32,
  tabHalf: 46,
  tabDepth: 84,
  corner: 20,
  inset: 18,
};

/** The chat page: a 300 px orb over a 600 px console. */
export const CONSOLE_PAGE: ConsoleShape = {
  width: 600,
  height: 470,
  scoop: 131,
  scoopDepth: 44,
  tabHalf: 46,
  tabDepth: 84,
  corner: 24,
  inset: 22,
};

const f = (n: number) => Number(n.toFixed(2)).toString();

/** The scoop's chord is this much of its radius each side of centre — a cup,
 * not a half-circle. */
const SCOOP_CHORD = 0.87;
/** The orb's canvas draws the ball at this fraction of its half-size. */
export const BALL_OF_ORB = 246 / 300;
/** The even gap between the ball and the cup, px. */
export const BALL_GAP = 8;

/** The radius of the fillets that join the cradle to the frame's bottom edge. */
const TAB_FILLET = 12;

/**
 * The frame as an SVG path. Drawn clockwise from the top-left corner: the top
 * edge runs to the scoop's shoulder, curves down into the arc around the orb
 * and back up to the far shoulder, on to the right corner, down the side, then
 * the bottom edge dips into the tab and returns to the left side.
 */
export function consolePath(s: ConsoleShape): string {
  const left = s.inset;
  const right = s.width - s.inset;
  const top = s.inset;
  const bottom = s.height - s.inset - s.tabDepth;
  const cx = s.width / 2;
  const c = s.corner;
  // the scoop: an arc of radius `scoop` whose chord (0.87 of the radius each
  // side) sits `scoopDepth` below the top edge — a cup the ball rests in, as
  // the mockup, not a full half-circle
  const shoulder = 14;
  const chordHalf = s.scoop * SCOOP_CHORD;
  const arcStart = cx - chordHalf;
  const arcEnd = cx + chordHalf;
  const arcY = top + s.scoopDepth;
  // the tab: a cradle — an arc of radius `tabHalf` around the coin's centre,
  // joined to the bottom edge by two concave fillets tangent to both the edge
  // and the arc, so the neck is smooth and the gap around the coin is even
  const R = s.tabHalf;
  const r = TAB_FILLET;
  const cy = bottom + s.tabDepth - R;
  const d = cy - bottom;
  const fx = Math.sqrt((R + r) ** 2 - (r - d) ** 2);
  const fr = { x: cx + fx, y: bottom + r };
  const fl = { x: cx - fx, y: bottom + r };
  const k = r / (R + r);
  const tr = { x: fr.x + (cx - fr.x) * k, y: fr.y + (cy - fr.y) * k };
  const tl = { x: fl.x + (cx - fl.x) * k, y: fl.y + (cy - fl.y) * k };
  const tabTop = bottom;
  return [
    `M ${f(left + c)} ${f(top)}`,
    `L ${f(arcStart - shoulder * 1.9)} ${f(top)}`,
    `C ${f(arcStart - shoulder * 0.9)} ${f(top)}, ${f(arcStart - shoulder * 0.4)} ${f(top + 6)}, ${f(arcStart)} ${f(arcY)}`,
    `A ${f(s.scoop)} ${f(s.scoop)} 0 0 0 ${f(arcEnd)} ${f(arcY)}`,
    `C ${f(arcEnd + shoulder * 0.4)} ${f(top + 6)}, ${f(arcEnd + shoulder * 0.9)} ${f(top)}, ${f(arcEnd + shoulder * 1.9)} ${f(top)}`,
    `L ${f(right - c)} ${f(top)}`,
    `Q ${f(right)} ${f(top)} ${f(right)} ${f(top + c)}`,
    `L ${f(right)} ${f(tabTop - c)}`,
    `Q ${f(right)} ${f(tabTop)} ${f(right - c)} ${f(tabTop)}`,
    `L ${f(fr.x)} ${f(tabTop)}`,
    `A ${f(r)} ${f(r)} 0 0 0 ${f(tr.x)} ${f(tr.y)}`,
    `A ${f(R)} ${f(R)} 0 1 1 ${f(tl.x)} ${f(tl.y)}`,
    `A ${f(r)} ${f(r)} 0 0 0 ${f(fl.x)} ${f(tabTop)}`,
    `L ${f(left + c)} ${f(tabTop)}`,
    `Q ${f(left)} ${f(tabTop)} ${f(left)} ${f(tabTop - c)}`,
    `L ${f(left)} ${f(top + c)}`,
    `Q ${f(left)} ${f(top)} ${f(left + c)} ${f(top)}`,
    "Z",
  ].join(" ");
}

/** The centre of the scoop's arc, in the frame's px from its top — where the
 * orb's centre must sit for the gap around the ball to be even. */
export function scoopCentreY(s: ConsoleShape): number {
  const chordHalf = s.scoop * SCOOP_CHORD;
  return s.inset + s.scoopDepth - Math.sqrt(s.scoop ** 2 - chordHalf ** 2);
}

/** A preset narrowed to the width it has — the path scales by its parameters. */
export function fitConsole(s: ConsoleShape, available: number): ConsoleShape {
  const width = Math.min(s.width, Math.max(2 * s.scoop + 4 * s.inset, Math.floor(available)));
  return width === s.width ? s : { ...s, width };
}

/** Where the mic sits: the cradle's centre, in the frame's px. */
export function micCentre(s: ConsoleShape): { x: number; y: number } {
  const bottom = s.height - s.inset - s.tabDepth;
  return { x: s.width / 2, y: bottom + s.tabDepth - s.tabHalf };
}

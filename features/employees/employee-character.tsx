import { useId } from "react";

import { CHARACTERS, characterLabel, moodFor, type CharacterKind, type Mood } from "@/lib/employee-character";
import type { Employee } from "@/types/employees";

/**
 * One digital employee, drawn (SPEC-291). A shared body — shoulders, neck, head,
 * eyes with lids, brows, mouth, cheeks, the brand dot on the collar — and one prop
 * that shows the job. Every fill and stroke is a token so it holds in both themes.
 *
 * Nothing here moves by itself: the CSS in `globals.css` (`emp-*`) reads
 * `data-mood` for the expression, `--gx`/`--gy` (written by `useGaze`) for where the
 * eyes look, and the card's `:hover`/`:focus-within` for "active", when the prop does
 * its work. The SVG is an image with a name; the chip and the rows carry the facts.
 */

const STROKE = "var(--foreground)";
const FILL = "var(--card)";
const ACCENT = "var(--ai)";

function Eye({ cx, clipId }: { cx: number; clipId: string }) {
  return (
    <g className="emp-eye">
      <circle cx={cx} cy={50} r={7} fill="var(--background)" stroke={STROKE} strokeWidth={2} />
      <circle cx={cx} cy={50} r={3.4} fill={STROKE} className="emp-pupil" />
      <circle cx={cx + 1.4} cy={48.4} r={1} fill="var(--background)" className="emp-pupil" />
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={cx - 9}
          y={41}
          width={18}
          height={18}
          fill={FILL}
          className="emp-lid"
          style={{ transformOrigin: `${cx}px 41px` }}
        />
      </g>
      <path
        d={`M${cx - 6} 50.5 Q${cx} 56 ${cx + 6} 50.5`}
        fill="none"
        stroke={STROKE}
        strokeWidth={2}
        strokeLinecap="round"
        className="emp-lash"
      />
    </g>
  );
}

function Face({ id }: { id: string }) {
  return (
    <g className="emp-face">
      <defs>
        <clipPath id={`${id}-l`}>
          <circle cx={52} cy={50} r={8.2} />
        </clipPath>
        <clipPath id={`${id}-r`}>
          <circle cx={76} cy={50} r={8.2} />
        </clipPath>
      </defs>
      <circle cx={44} cy={61} r={3.2} fill={ACCENT} opacity={0.22} />
      <circle cx={84} cy={61} r={3.2} fill={ACCENT} opacity={0.22} />
      <Eye cx={52} clipId={`${id}-l`} />
      <Eye cx={76} clipId={`${id}-r`} />
      <path
        d="M45 38 Q52 33 59 37"
        fill="none"
        stroke={STROKE}
        strokeWidth={2.4}
        strokeLinecap="round"
        className="emp-brow emp-brow-l"
        style={{ transformOrigin: "52px 36px" }}
      />
      <path
        d="M69 37 Q76 33 83 38"
        fill="none"
        stroke={STROKE}
        strokeWidth={2.4}
        strokeLinecap="round"
        className="emp-brow emp-brow-r"
        style={{ transformOrigin: "76px 36px" }}
      />
      <path
        d="M56 66 Q64 73 72 66"
        fill="none"
        stroke={STROKE}
        strokeWidth={2.4}
        strokeLinecap="round"
        className="emp-mouth emp-mouth-smile"
      />
      <path
        d="M57 68 H71"
        fill="none"
        stroke={STROKE}
        strokeWidth={2.4}
        strokeLinecap="round"
        className="emp-mouth emp-mouth-flat"
      />
      <ellipse cx={64} cy={68} rx={4} ry={5} fill={STROKE} className="emp-mouth emp-mouth-open" />
    </g>
  );
}

function Hair({ kind }: { kind: CharacterKind }) {
  switch (kind) {
    case "telescope":
      // A swept fringe.
      return <path d="M37 42 Q38 20 66 22 Q86 22 91 40 Q80 30 66 34 Q52 28 37 42 Z" fill={STROKE} />;
    case "megaphone":
      // A top bun.
      return (
        <>
          <circle cx={64} cy={20} r={8} fill={STROKE} />
          <path d="M37 40 Q40 22 64 23 Q88 22 91 40 Q78 33 64 34 Q50 33 37 40 Z" fill={STROKE} />
        </>
      );
    case "target":
      // A cap with a visor.
      return (
        <>
          <path d="M37 40 Q40 20 64 21 Q88 20 91 40 Z" fill={STROKE} />
          <rect x={58} y={36} width={40} height={6} rx={3} fill={STROKE} />
        </>
      );
    case "ledger":
      // A green-visor cap, the bookkeeper's hat.
      return (
        <>
          <path d="M37 40 Q40 21 64 22 Q88 21 91 40 Q78 32 64 33 Q50 32 37 40 Z" fill={STROKE} />
          <path d="M34 40 H94 a3 3 0 0 1 0 6 H34 a3 3 0 0 1 0 -6 Z" fill={STROKE} />
          <path d="M40 46 Q64 58 88 46 Q64 52 40 46 Z" fill={ACCENT} opacity={0.5} />
        </>
      );
    case "clipboard":
      // A side part and round glasses.
      return (
        <>
          <path d="M37 42 Q40 22 64 22 Q88 22 91 42 Q82 32 60 33 Q48 34 37 42 Z" fill={STROKE} />
          <circle cx={52} cy={50} r={10.5} fill="none" stroke={STROKE} strokeWidth={2} />
          <circle cx={76} cy={50} r={10.5} fill="none" stroke={STROKE} strokeWidth={2} />
          <path d="M62.5 50 H65.5" stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "headset":
      // A short crop under a headset — band, ear cups and a mic at the mouth (SPEC-346). Drawn
      // with the hair so it tilts with the head.
      return (
        <>
          <path d="M37 40 Q38 21 64 21 Q90 21 91 40 Q84 30 70 31 Q56 27 44 33 Q40 36 37 40 Z" fill={STROKE} />
          <path d="M33 52 Q33 12 64 12 Q95 12 95 52" fill="none" stroke={STROKE} strokeWidth={3.2} strokeLinecap="round" />
          <rect x={28} y={43} width={10} height={17} rx={4} fill={ACCENT} stroke={STROKE} strokeWidth={2.2} />
          <rect x={90} y={43} width={10} height={17} rx={4} fill={ACCENT} stroke={STROKE} strokeWidth={2.2} />
          <path d="M33 60 Q35 75 51 75" fill="none" stroke={STROKE} strokeWidth={2.4} strokeLinecap="round" />
          <circle cx={53} cy={75} r={3} fill={STROKE} />
        </>
      );
    case "stopwatch":
      // A sweatband over a short crop — the coach (SPEC-385).
      return (
        <>
          <path d="M37 41 Q39 22 64 22 Q89 22 91 41 Q82 33 64 33 Q46 33 37 41 Z" fill={STROKE} />
          <path d="M35 36 Q64 26 93 36 L93 42 Q64 32 35 42 Z" fill={ACCENT} stroke={STROKE} strokeWidth={1.8} />
        </>
      );
    case "envelope":
      // A high ponytail (SPEC-345).
      return (
        <>
          <path d="M37 41 Q39 21 64 21 Q89 21 91 41 Q80 31 64 32 Q48 31 37 41 Z" fill={STROKE} />
          <path d="M84 24 Q100 22 98 44 Q96 34 86 31 Z" fill={STROKE} />
        </>
      );
  }
}

function Prop({ kind }: { kind: CharacterKind }) {
  switch (kind) {
    case "telescope":
      return (
        <g className="emp-prop emp-prop-telescope">
          <g className="emp-beam" style={{ transformOrigin: "111px 36px" }}>
            <polygon points="111,36 92,0 130,0" fill={ACCENT} opacity={0.18} />
            <circle cx={106} cy={18} r={1.7} fill={ACCENT} className="emp-star" />
            <circle cx={117} cy={9} r={1.4} fill={ACCENT} className="emp-star" />
            <circle cx={114} cy={26} r={1.2} fill={ACCENT} className="emp-star" />
          </g>
          <g transform="rotate(-14 111 54)">
            <rect x={105} y={38} width={12} height={32} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
            <rect x={103.5} y={34} width={15} height={8} rx={3} fill={ACCENT} />
            <rect x={107} y={56} width={8} height={3} rx={1.5} fill={STROKE} />
          </g>
          <path d="M111 70 L101 100 M111 70 L121 100 M111 70 V102" stroke={STROKE} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );
    case "megaphone":
      return (
        <g className="emp-prop emp-prop-megaphone">
          <path d="M8 60 L30 50 V78 L8 68 Z" fill={FILL} stroke={STROKE} strokeWidth={2.4} strokeLinejoin="round" />
          <rect x={4} y={60} width={6} height={8} rx={2} fill={STROKE} />
          <rect x={27} y={54} width={6} height={20} rx={2} fill={STROKE} />
          <rect x={18} y={76} width={8} height={12} rx={2} fill={FILL} stroke={STROKE} strokeWidth={2.2} />
          <g className="emp-hearts">
            <path d="M12 44 c-2-3-7-2-7 2 c0 3 7 7 7 7 s7-4 7-7 c0-4-5-5-7-2z" fill={ACCENT} className="emp-heart" />
            <path d="M22 36 c-1.6-2.4-5.6-1.6-5.6 1.6 c0 2.4 5.6 5.6 5.6 5.6 s5.6-3.2 5.6-5.6 c0-3.2-4-4-5.6-1.6z" fill={ACCENT} className="emp-heart" />
            <path d="M6 30 c-1.2-1.8-4.2-1.2-4.2 1.2 c0 1.8 4.2 4.2 4.2 4.2 s4.2-2.4 4.2-4.2 c0-2.4-3-3-4.2-1.2z" fill={ACCENT} className="emp-heart" />
          </g>
        </g>
      );
    case "target":
      return (
        <g className="emp-prop emp-prop-target">
          <g className="emp-target" style={{ transformOrigin: "113px 64px" }}>
            <circle cx={113} cy={64} r={15} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
            <circle cx={113} cy={64} r={9} fill="none" stroke={STROKE} strokeWidth={2.2} />
            <circle cx={113} cy={64} r={3.5} fill={ACCENT} />
            <path d="M109 80 L104 108 M117 80 L122 108" stroke={STROKE} strokeWidth={2.2} strokeLinecap="round" />
          </g>
          <g className="emp-arrow">
            <path d="M84 90 L110 66" stroke={STROKE} strokeWidth={2.6} strokeLinecap="round" />
            <path d="M108 62 L114 65 L110 70 Z" fill={STROKE} />
            <path d="M84 90 L80 86 M84 90 L88 94" stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" />
          </g>
        </g>
      );
    case "ledger":
      return (
        <g className="emp-prop emp-prop-ledger">
          <rect x={4} y={70} width={32} height={40} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
          <path d="M20 72 V108" stroke={STROKE} strokeWidth={2} />
          <path d="M9 80 H16 M24 80 H32" stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" className="emp-line" />
          <path d="M9 88 H16 M24 88 H32" stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" className="emp-line" />
          <path d="M9 96 H16 M24 96 H32" stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" className="emp-line" />
          <g className="emp-coins">
            <ellipse cx={108} cy={106} rx={14} ry={4.5} fill={FILL} stroke={STROKE} strokeWidth={2.2} />
            <ellipse cx={108} cy={98} rx={14} ry={4.5} fill={FILL} stroke={STROKE} strokeWidth={2.2} />
            <ellipse cx={108} cy={90} rx={14} ry={4.5} fill={ACCENT} stroke={STROKE} strokeWidth={2.2} />
          </g>
        </g>
      );
    case "clipboard":
      return (
        <g className="emp-prop emp-prop-clipboard">
          <rect x={40} y={92} width={48} height={36} rx={5} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
          <rect x={56} y={88} width={16} height={8} rx={3} fill={STROKE} />
          <path d="M48 104 H80" stroke={ACCENT} strokeWidth={2.6} strokeLinecap="round" className="emp-line" />
          <path d="M48 112 H74" stroke={ACCENT} strokeWidth={2.6} strokeLinecap="round" className="emp-line" />
          <path d="M48 120 H68" stroke={ACCENT} strokeWidth={2.6} strokeLinecap="round" className="emp-line" />
          <g className="emp-pen" style={{ transformOrigin: "104px 116px" }}>
            <rect x={99} y={84} width={9} height={30} rx={3} fill={FILL} stroke={STROKE} strokeWidth={2.2} transform="rotate(28 103.5 99)" />
            <path d="M107 112 L104 122 L99 114 Z" fill={ACCENT} transform="rotate(28 103.5 99)" />
          </g>
        </g>
      );
    case "stopwatch":
      // SPEC-385: a stopwatch whose hand sweeps while the card is active.
      return (
        <g className="emp-prop emp-prop-stopwatch">
          <rect x={106} y={6} width={8} height={6} rx={2} fill={STROKE} />
          <circle cx={110} cy={26} r={14} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
          <g className="emp-dot" style={{ transformOrigin: "110px 26px" }}>
            <path d="M110 26 L110 16" stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" />
          </g>
          <circle cx={110} cy={26} r={2} fill={STROKE} />
        </g>
      );
    case "headset":
      // SPEC-346: a speech bubble whose dots type while the card is active.
      return (
        <g className="emp-prop emp-prop-headset">
          <path
            d="M100 6 H120 A6 6 0 0 1 126 12 V26 A6 6 0 0 1 120 32 H110 L103 38 V32 H100 A6 6 0 0 1 94 26 V12 A6 6 0 0 1 100 6 Z"
            fill={FILL}
            stroke={STROKE}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <circle cx={102} cy={19} r={2.2} fill={ACCENT} className="emp-dot" />
          <circle cx={110} cy={19} r={2.2} fill={ACCENT} className="emp-dot" />
          <circle cx={118} cy={19} r={2.2} fill={ACCENT} className="emp-dot" />
        </g>
      );
    case "envelope":
      // SPEC-345: a letter that rises out of its envelope when the employee wakes.
      return (
        <g className="emp-prop emp-prop-envelope">
          <g className="emp-letter">
            <rect x={9} y={66} width={26} height={22} rx={2} fill={FILL} stroke={STROKE} strokeWidth={2} />
            <path d="M13 72 H31 M13 77 H27" stroke={ACCENT} strokeWidth={2.2} strokeLinecap="round" />
          </g>
          <rect x={4} y={76} width={36} height={26} rx={4} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
          <path d="M4 100 L22 86 L40 100" fill="none" stroke={STROKE} strokeWidth={2} strokeLinejoin="round" />
          <path
            d="M5 78 L22 92 L39 78"
            fill={FILL}
            stroke={STROKE}
            strokeWidth={2.4}
            strokeLinejoin="round"
            className="emp-flap"
            style={{ transformOrigin: "22px 77px" }}
          />
          <circle cx={22} cy={90} r={3} fill={ACCENT} className="emp-seal" />
        </g>
      );
  }
}

/** The raised hand of a Needs-you face. It stands on whichever side the prop leaves
 * free — the megaphone is on the left, so its hand is on the right; the telescope,
 * the target and the pen are on the right, so theirs is mirrored to the left. */
function Hand({ side }: { side: "left" | "right" }) {
  return (
    <g
      className="emp-hand"
      style={{ transformOrigin: side === "right" ? "113px 94px" : "15px 94px" }}
      transform={side === "left" ? "matrix(-1 0 0 1 128 0)" : undefined}
    >
      <path d="M113 94 V78" stroke={STROKE} strokeWidth={6} strokeLinecap="round" />
      <rect x={104} y={62} width={18} height={20} rx={7} fill={FILL} stroke={STROKE} strokeWidth={2.2} />
      <rect x={105} y={54} width={4} height={12} rx={2} fill={FILL} stroke={STROKE} strokeWidth={2} />
      <rect x={110.5} y={51} width={4} height={14} rx={2} fill={FILL} stroke={STROKE} strokeWidth={2} />
      <rect x={116} y={53} width={4} height={12} rx={2} fill={FILL} stroke={STROKE} strokeWidth={2} />
      <rect x={100} y={66} width={7} height={5} rx={2.5} fill={FILL} stroke={STROKE} strokeWidth={2} />
    </g>
  );
}

function Sleep() {
  return (
    <g className="emp-zz" fill={STROKE} fontFamily="Inter, sans-serif" fontWeight={700}>
      <text x={18} y={36} fontSize={11}>
        z
      </text>
      <text x={27} y={24} fontSize={9}>
        z
      </text>
    </g>
  );
}

export function EmployeeCharacter({ employee, mood }: { employee: Employee; mood?: Mood }) {
  const face: Mood = mood ?? moodFor(employee.status);
  const { kind } = CHARACTERS[employee.key];
  const id = useId();
  return (
    <svg
      viewBox="0 0 128 128"
      className="emp-svg size-full"
      role="img"
      aria-label={characterLabel(employee.name, face)}
      data-character={kind}
      data-mood={face}
    >
      {/* Shoulders + neck sit under the head; the clipboard sits in front of them. */}
      <path
        d="M18 128 V118 C18 102 40 92 64 92 C88 92 110 102 110 118 V128 Z"
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <rect x={56} y={78} width={16} height={16} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
      <circle cx={64} cy={100} r={3} fill="var(--brand)" />
      {kind !== "clipboard" ? <Prop kind={kind} /> : null}
      <g className="emp-head" style={{ transformOrigin: "64px 74px" }}>
        <rect x={36} y={22} width={56} height={60} rx={22} fill={FILL} stroke={STROKE} strokeWidth={2.4} />
        <Face id={id} />
        <Hair kind={kind} />
      </g>
      {kind === "clipboard" ? <Prop kind={kind} /> : null}
      {face === "needs_you" ? <Hand side={kind === "megaphone" || kind === "envelope" ? "right" : "left"} /> : null}
      {face === "asleep" ? <Sleep /> : null}
    </svg>
  );
}

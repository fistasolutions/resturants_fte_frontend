import { describe, expect, it } from "vitest";

import { BALL_GAP, BALL_OF_ORB, CONSOLE_PAGE, CONSOLE_PANEL, consolePath, fitConsole, micCentre, scoopCentreY } from "@/lib/voice-console";

describe("the voice console's frame", () => {
  it("is one closed path with the scoop around the orb and the mic tab at the foot", () => {
    const d = consolePath(CONSOLE_PANEL);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    // the scoop is a real arc of the orb's radius, on the top edge
    expect(d).toContain(`A ${CONSOLE_PANEL.scoop} ${CONSOLE_PANEL.scoop} 0 0 0`);
    // the tab is a cradle: an arc of the coin's radius plus the gap, around the mic
    expect(d).toContain(`A ${CONSOLE_PANEL.tabHalf} ${CONSOLE_PANEL.tabHalf} 0 1 1`);
    const mic = micCentre(CONSOLE_PANEL);
    const edge = CONSOLE_PANEL.height - CONSOLE_PANEL.inset - CONSOLE_PANEL.tabDepth;
    expect(mic.y).toBeGreaterThan(edge);
    expect(mic.y + CONSOLE_PANEL.tabHalf).toBe(CONSOLE_PANEL.height - CONSOLE_PANEL.inset);
    // nothing leaves the viewBox
    const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
    expect(numbers.every((n) => n <= Math.max(CONSOLE_PANEL.width, CONSOLE_PANEL.height))).toBe(true);
  });
  it("scales by its parameters, never by stretching", () => {
    const panel = consolePath(CONSOLE_PANEL);
    const page = consolePath(CONSOLE_PAGE);
    expect(page).not.toBe(panel);
    expect(page).toContain(`A ${CONSOLE_PAGE.scoop} ${CONSOLE_PAGE.scoop}`);
    expect(micCentre(CONSOLE_PANEL)).toEqual({ x: 208, y: 456 - 18 - 84 + 38 });
    // the scoop is a cup, not a half-circle: its chord is narrower than its diameter
    const d = consolePath(CONSOLE_PANEL);
    const arc = d.match(new RegExp(`C [^A]* A ${CONSOLE_PANEL.scoop} ${CONSOLE_PANEL.scoop} 0 0 0 (\\d+(\\.\\d+)?) `));
    expect(arc).not.toBeNull();
    expect(Number(arc![1])).toBeLessThan(CONSOLE_PANEL.width / 2 + CONSOLE_PANEL.scoop);
    expect(micCentre(CONSOLE_PAGE).x).toBe(300);
  });
  it("cups the ball at an even gap, and narrows to the stage without stretching", () => {
    // the scoop is the ball's drawn radius plus the gap, for each preset's orb
    expect(CONSOLE_PANEL.scoop).toBe(Math.round((220 / 2) * BALL_OF_ORB + BALL_GAP));
    expect(CONSOLE_PAGE.scoop).toBe(Math.round((300 / 2) * BALL_OF_ORB + BALL_GAP));
    // the arc's centre is above its chord, inside the frame
    const centre = scoopCentreY(CONSOLE_PANEL);
    expect(centre).toBeLessThan(CONSOLE_PANEL.inset + CONSOLE_PANEL.scoopDepth);
    expect(centre).toBeGreaterThan(0);
    // a phone's width narrows the frame; the scoop and the tab keep their size
    const slim = fitConsole(CONSOLE_PANEL, 372);
    expect(slim.width).toBe(372);
    expect(slim.scoop).toBe(CONSOLE_PANEL.scoop);
    expect(consolePath(slim)).toContain(`A ${CONSOLE_PANEL.scoop} ${CONSOLE_PANEL.scoop}`);
    expect(fitConsole(CONSOLE_PANEL, 900)).toBe(CONSOLE_PANEL);
  });
});

import { describe, expect, it } from "vitest";

import { apiErrorFromResponse } from "@/lib/api-error";
import {
  adaptSupportSession,
  hasMarker,
  isSupportBlocked,
  markerValue,
  secondsLeft,
  SUPPORT_COOKIE,
  timeLeftLabel,
} from "@/lib/support-session";

const NOW = Date.parse("2026-10-09T12:00:00Z");

describe("support session (SPEC-363)", () => {
  it("counts down in whole minutes", () => {
    expect(timeLeftLabel("2026-10-09T12:27:00Z", NOW)).toBe("27 min left");
    expect(timeLeftLabel("2026-10-09T12:00:30Z", NOW)).toBe("Under a minute left");
    expect(timeLeftLabel("2026-10-09T12:00:61Z", NOW)).toBe("Ended"); // unreadable date
    expect(timeLeftLabel("2026-10-09T11:59:00Z", NOW)).toBe("Ended");
    expect(timeLeftLabel("2026-10-09T12:01:01Z", NOW)).toBe("2 min left");
  });

  it("gives the cookie exactly the time that is left", () => {
    expect(secondsLeft("2026-10-09T12:30:00Z", NOW)).toBe(1800);
    expect(secondsLeft("2026-10-09T11:00:00Z", NOW)).toBe(0);
    expect(secondsLeft("not a date", NOW)).toBe(0);
    expect(markerValue("2026-10-09T12:30:00Z")).toBe(String(Date.parse("2026-10-09T12:30:00Z") / 1000));
    expect(markerValue("nope")).toBe("0");
  });

  it("finds the marker among other cookies", () => {
    expect(hasMarker(`theme=dark; ${SUPPORT_COOKIE}=1760011800; sidebar=open`)).toBe(true);
    expect(hasMarker("theme=dark; sidebar=open")).toBe(false);
    expect(hasMarker(`x${SUPPORT_COOKIE}=1`)).toBe(false);
    expect(hasMarker("")).toBe(false);
  });

  it("knows the refusal from every other error", () => {
    expect(isSupportBlocked(423, "support_session_blocked")).toBe(true);
    expect(isSupportBlocked(403, "support_session_blocked")).toBe(false);
    expect(isSupportBlocked(423, "locked")).toBe(false);
  });

  it("adapts the /auth/me field", () => {
    expect(adaptSupportSession(null)).toBeNull();
    expect(
      adaptSupportSession({
        id: "s1",
        operator: "hamza@ftes.ai",
        reason: "Ticket 123",
        organization_name: "Example Store",
        expires_at: "2026-10-09T12:30:00Z",
      }),
    ).toEqual({
      id: "s1",
      operator: "hamza@ftes.ai",
      reason: "Ticket 123",
      companyName: "Example Store",
      expiresAt: "2026-10-09T12:30:00Z",
    });
  });

  it("still builds the ordinary ApiError for a refused send (outside a browser)", async () => {
    const response = new Response(
      JSON.stringify({ error: { code: "support_session_blocked", message: "Nothing was sent." } }),
      { status: 423 },
    );
    const error = await apiErrorFromResponse(response);
    expect(error.status).toBe(423);
    expect(error.code).toBe("support_session_blocked");
    expect(error.message).toBe("Nothing was sent.");
  });
});

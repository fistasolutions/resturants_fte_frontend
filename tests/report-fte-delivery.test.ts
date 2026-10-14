/**
 * SPEC-335 — who a report goes to and the schedule the owner picks: address rules, the
 * dialog's opening values, the request body, and the saved-schedule label.
 */
import { describe, expect, it } from "vitest";

import { badgeText, bellLabel, notificationHref } from "@/lib/notifications";
import {
  MAX_RECIPIENTS,
  addRecipient,
  cadenceFromRuns,
  defaultChoice,
  initialRecipients,
  isEmail,
  recipientLabel,
  removeRecipient,
  savedScheduleLabel,
  scheduleBody,
  scheduleProblem,
  toggleRecipient,
} from "@/lib/report-fte-delivery";
import { composerReducer, initialComposerState, type ComposerState } from "@/lib/report-fte";

describe("recipients", () => {
  it("adds valid addresses once and says why a bad one is refused", () => {
    expect(isEmail("owner@examplestore.com")).toBe(true);
    expect(isEmail("boss@shop")).toBe(false);
    let list = addRecipient([], " owner@examplestore.com, ").next;
    expect(list).toEqual(["owner@examplestore.com"]);
    expect(addRecipient(list, "OWNER@examplestore.com").next).toEqual(list);
    const refused = addRecipient(list, "not-an-address");
    expect(refused.next).toEqual(list);
    expect(refused.error).toBe("not-an-address is not an email address.");
    list = toggleRecipient(list, "jackson@examplestore.com");
    expect(list).toEqual(["owner@examplestore.com", "jackson@examplestore.com"]);
    expect(toggleRecipient(list, "JACKSON@examplestore.com")).toEqual(["owner@examplestore.com"]);
    expect(removeRecipient(list, "owner@examplestore.com")).toEqual(["jackson@examplestore.com"]);
  });

  it("caps the list", () => {
    const full = Array.from({ length: MAX_RECIPIENTS }, (_, i) => `p${i}@examplestore.com`);
    expect(addRecipient(full, "one-more@examplestore.com").error).toMatch(/at most 20/);
  });

  it("starts from a scheduled run's people, else the owner", () => {
    expect(initialRecipients(["owner@examplestore.com"], ["a@examplestore.com"])).toEqual(["a@examplestore.com"]);
    expect(initialRecipients(["owner@examplestore.com"], [])).toEqual(["owner@examplestore.com"]);
    expect(initialRecipients(["owner@examplestore.com"], null)).toEqual(["owner@examplestore.com"]);
  });

  it("labels a chip from the directory", () => {
    const options = [{ email: "jackson@examplestore.com", label: "Manager · Jackson", kind: "location" as const }];
    expect(recipientLabel("JACKSON@examplestore.com", options)).toBe("Manager · Jackson");
    expect(recipientLabel("x@examplestore.com", options)).toBeNull();
  });
});

describe("the schedule", () => {
  it("opens on the plan's cadence and sends automatically", () => {
    expect(cadenceFromRuns("Daily 06:00")).toBe("daily");
    expect(cadenceFromRuns("1st monthly 07:00")).toBe("monthly");
    expect(cadenceFromRuns("Mon 07:00")).toBe("weekly");
    const choice = defaultChoice("daily", ["owner@examplestore.com"]);
    expect(choice).toMatchObject({ cadence: "daily", hour: 6, minute: 0, mode: "auto", showOnReports: true });
  });

  it("sends only the fields its cadence uses", () => {
    const weekly = { ...defaultChoice("weekly", ["a@examplestore.com"]), weekday: 2, dayOfMonth: 9 };
    expect(scheduleBody(weekly)).toEqual({
      cadence: "weekly",
      weekday: 2,
      day_of_month: null,
      hour: 7,
      minute: 0,
      recipients: ["a@examplestore.com"],
      mode: "auto",
      show_on_reports: true,
    });
    const monthly = { ...weekly, cadence: "monthly" as const, mode: "ask" as const };
    expect(scheduleBody(monthly)).toMatchObject({ weekday: null, day_of_month: 9, mode: "ask" });
  });

  it("refuses a schedule with nobody to send to", () => {
    expect(scheduleProblem(defaultChoice("weekly", []))).toBe("Choose at least one person to send it to.");
    expect(scheduleProblem(defaultChoice("weekly", ["a@examplestore.com"]))).toBeNull();
  });

  it("labels the button from what was saved, never a fixed 'weekly'", () => {
    const base = { scheduleId: 1, next: "Mon 07:00", authority: "sends_alone" as const, status: "" };
    expect(savedScheduleLabel({ ...base, cadence: "weekly", runs: "Wed 09:30", recipients: ["a@x.co", "b@x.co", "c@x.co"] })).toBe(
      "Weekly · Wed 09:30 · 3 people",
    );
    expect(savedScheduleLabel({ ...base, cadence: "daily", runs: "Daily 06:00", recipients: ["a@x.co"] })).toBe(
      "Daily · 06:00 · 1 person",
    );
  });

  it("lets an approved report be sent again or rescheduled", () => {
    let state: ComposerState = { ...initialComposerState(""), phase: "ready" };
    state = composerReducer(state, { type: "schedule", runs: "Mon 07:00" });
    state = composerReducer(state, { type: "schedule", runs: "Daily 06:00", status: "Scheduled · Daily 06:00" });
    expect(state.phase).toBe("scheduled");
    expect(state.status).toBe("Scheduled · Daily 06:00");
    state = composerReducer(state, { type: "send", to: "a", at: "" });
    state = composerReducer(state, { type: "send", to: "b", at: "", status: "Sent again" });
    expect(state.phase).toBe("sent");
    expect(state.status).toBe("Sent again");
  });
});

describe("the bell", () => {
  it("counts, labels and links safely", () => {
    expect(badgeText(0)).toBeNull();
    expect(badgeText(3)).toBe("3");
    expect(badgeText(12)).toBe("9+");
    expect(bellLabel(2)).toBe("Notifications, 2 unread");
    const base = { id: 1, kind: "report_sent", title: "t", body: "", createdAt: null, read: false };
    expect(notificationHref({ ...base, href: "/report-fte/reports/4" })).toBe("/report-fte/reports/4");
    expect(notificationHref({ ...base, href: "//evil.example" })).toBeNull();
    expect(notificationHref({ ...base, href: "https://evil.example" })).toBeNull();
  });
});

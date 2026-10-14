import { describe, expect, it } from "vitest";

import { isTimeValue, timeLabel, timeOptions } from "@/lib/time-options";

describe("time options", () => {
  it("steps every 15 minutes across the day", () => {
    const options = timeOptions();
    expect(options).toHaveLength(96);
    expect(options[0]).toEqual({ value: "00:00", label: "12:00 AM" });
    expect(options[1].value).toBe("00:15");
    expect(options.at(-1)).toEqual({ value: "23:45", label: "11:45 PM" });
  });

  it("keeps a saved time that is off the step, in order", () => {
    const options = timeOptions("06:50");
    expect(options).toHaveLength(97);
    const at = options.findIndex((o) => o.value === "06:50");
    expect(options[at - 1].value).toBe("06:45");
    expect(options[at + 1].value).toBe("07:00");
    expect(timeOptions("07:00")).toHaveLength(96);
  });

  it("ignores a value that is not a time", () => {
    expect(timeOptions("7pm")).toHaveLength(96);
    expect(isTimeValue("24:00")).toBe(false);
    expect(isTimeValue("07:00")).toBe(true);
  });

  it("labels in the 12-hour clock", () => {
    expect(timeLabel("00:15")).toBe("12:15 AM");
    expect(timeLabel("12:00")).toBe("12:00 PM");
    expect(timeLabel("13:45")).toBe("1:45 PM");
    expect(timeLabel("oops")).toBe("oops");
  });
});

import { describe, expect, it } from "vitest";

import {
  DEFAULT_APPROVALS_VIEW,
  approvalsHref,
  approvalsQuery,
  approvalsViewFrom,
  hasFilters,
  pageCount,
  rangeLabel,
} from "@/lib/support-approvals";

describe("approvals view in the URL (SPEC-349)", () => {
  it("reads a view and refuses values that are not allowed", () => {
    expect(approvalsViewFrom(new URLSearchParams("tab=approvals"))).toEqual(DEFAULT_APPROVALS_VIEW);
    expect(approvalsViewFrom(new URLSearchParams("topic=size_fit&channel=chat&confidence=low&q=avery&sort=value&page=3"))).toEqual({
      topic: "size_fit",
      channel: "chat",
      confidence: "low",
      q: "avery",
      sort: "value",
      page: 3,
    });
    expect(approvalsViewFrom(new URLSearchParams("topic=nope&channel=fax&confidence=sure&sort=x&page=-2"))).toEqual(DEFAULT_APPROVALS_VIEW);
  });

  it("writes hrefs and API queries with the defaults left out", () => {
    expect(approvalsHref(DEFAULT_APPROVALS_VIEW)).toBe("/customer-support?tab=approvals");
    expect(approvalsQuery(DEFAULT_APPROVALS_VIEW)).toBe("");
    const view = { ...DEFAULT_APPROVALS_VIEW, topic: "refund_status" as const, page: 4 };
    // A filter change goes back to page 1; an explicit page move keeps the filters.
    expect(approvalsHref(view, { confidence: "high" })).toBe("/customer-support?tab=approvals&topic=refund_status&confidence=high");
    expect(approvalsHref(view, { page: 5 })).toBe("/customer-support?tab=approvals&topic=refund_status&page=5");
    expect(approvalsHref(view)).toBe("/customer-support?tab=approvals&topic=refund_status&page=4");
    expect(approvalsQuery({ ...DEFAULT_APPROVALS_VIEW, q: "  mindy  " })).toBe("q=mindy");
  });

  it("knows when filters are set, and words the range", () => {
    expect(hasFilters(DEFAULT_APPROVALS_VIEW)).toBe(false);
    expect(hasFilters({ ...DEFAULT_APPROVALS_VIEW, q: " x " })).toBe(true);
    expect(pageCount(89, 20)).toBe(5);
    expect(pageCount(0, 20)).toBe(1);
    expect(rangeLabel(2, 20, 89)).toBe("21–40 of 89");
    expect(rangeLabel(5, 20, 89)).toBe("81–89 of 89");
    expect(rangeLabel(1, 20, 0)).toBe("None");
  });
});

import { describe, expect, it } from "vitest";

import { BACKLOG_BUCKETS, bucketMeta, isBacklogBucket } from "@/lib/warehouse-buckets";

describe("warehouse backlog buckets", () => {
  it("recognizes valid bucket keys and rejects others", () => {
    expect(isBacklogBucket("aged")).toBe(true);
    expect(isBacklogBucket("d30_plus")).toBe(true);
    expect(isBacklogBucket("all")).toBe(true);
    expect(isBacklogBucket("nope")).toBe(false);
    expect(isBacklogBucket(undefined)).toBe(false);
  });

  it("maps every declared bucket to a label + window, and defaults unknowns to 'all'", () => {
    for (const b of BACKLOG_BUCKETS) {
      expect(bucketMeta(b.key)).toEqual(b);
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.window.length).toBeGreaterThan(0);
    }
    // @ts-expect-error — exercising the runtime fallback for an off-union value
    expect(bucketMeta("bogus").key).toBe("all");
  });
});

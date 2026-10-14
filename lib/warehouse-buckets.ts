/** Backlog aging-bucket labels for the warehouse drilldown (SPEC-099). Pure —
 * unit-tested. Keys mirror the backend overview buckets + two aggregates. */
import type { BacklogBucket } from "@/types/warehouse";

export interface BucketMeta {
  key: BacklogBucket;
  /** Short chip label. */
  label: string;
  /** Human age window, for the drilldown subtitle. */
  window: string;
}

export const BACKLOG_BUCKETS: BucketMeta[] = [
  { key: "all", label: "All waiting", window: "every unfulfilled order" },
  { key: "d0_2", label: "0–2d", window: "waiting 0–2 days" },
  { key: "d3_7", label: "3–7d", window: "waiting 3–7 days" },
  { key: "d8_30", label: "8–30d", window: "waiting 8–30 days" },
  { key: "d30_plus", label: "30d+", window: "waiting more than 30 days" },
  { key: "aged", label: "Worth chasing", window: "waiting more than a week" },
];

const BY_KEY = new Map(BACKLOG_BUCKETS.map((b) => [b.key, b]));

export function isBacklogBucket(value: string | undefined): value is BacklogBucket {
  return value !== undefined && BY_KEY.has(value as BacklogBucket);
}

export function bucketMeta(bucket: BacklogBucket): BucketMeta {
  return BY_KEY.get(bucket) ?? BACKLOG_BUCKETS[0];
}

/** Backend `WatchOut` (snake_case) → `Watch` (SPEC-262). */
import type { Watch, WatchCheckResult, WatchList, WatchMetric, WatchRecipient } from "@/types/watch";

export interface ApiWatch {
  id: number;
  metric: string;
  label: string;
  unit: Watch["unit"];
  subject_label: string | null;
  product_id: number | null;
  period: string | null;
  direction: Watch["direction"];
  threshold: number;
  notify_nudge: boolean;
  notify_email: WatchRecipient | null;
  status: Watch["status"];
  state: Watch["state"];
  baseline_value: number | null;
  last_value: number | null;
  last_checked_at: string | null;
  fired_at: string | null;
  fired_value: number | null;
  fired_note: string | null;
  fire_count: number;
  email_sent_at: string | null;
  email_error: string | null;
  rule: string;
  current: string;
  href: string;
  created_at: string | null;
}

export interface ApiWatchList {
  watches: ApiWatch[];
  metrics: WatchMetric[];
  recipients: Record<WatchRecipient, boolean>;
}

export interface ApiWatchCheck {
  checked: number;
  fired: ApiWatch[];
  elapsed_ms: number;
}

export function toWatch(api: ApiWatch): Watch {
  return {
    id: api.id,
    metric: api.metric,
    label: api.label,
    unit: api.unit,
    subjectLabel: api.subject_label,
    productId: api.product_id,
    period: api.period,
    direction: api.direction,
    threshold: api.threshold,
    notifyNudge: api.notify_nudge,
    notifyEmail: api.notify_email,
    status: api.status,
    state: api.state,
    baselineValue: api.baseline_value,
    lastValue: api.last_value,
    lastCheckedAt: api.last_checked_at,
    firedAt: api.fired_at,
    firedValue: api.fired_value,
    firedNote: api.fired_note,
    fireCount: api.fire_count,
    emailSentAt: api.email_sent_at,
    emailError: api.email_error,
    rule: api.rule,
    current: api.current,
    href: api.href,
    createdAt: api.created_at,
  };
}

export function toWatchList(api: ApiWatchList): WatchList {
  return { watches: api.watches.map(toWatch), metrics: api.metrics, recipients: api.recipients };
}

export function toWatchCheck(api: ApiWatchCheck): WatchCheckResult {
  return { checked: api.checked, fired: api.fired.map(toWatch), elapsedMs: api.elapsed_ms };
}

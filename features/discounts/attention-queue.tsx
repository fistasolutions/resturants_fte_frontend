"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  ShoppingBag,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recipientSettingsHref } from "@/lib/recipient-settings";
import type { DiscountAttentionItem } from "@/types/discounts";
import { formatCurrency, formatDateTime, formatNumber, formatPercent } from "@/utils/format";

const PAGE_SIZE = 8;

function AttentionCard({ item }: { item: DiscountAttentionItem }) {
  const pathname = usePathname();
  const red = item.severity === "red";
  const tone = red ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5";
  const iconTone = red ? "text-destructive" : "text-warning";
  return (
    <Card className={`gap-3 border p-4 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={`mt-0.5 shrink-0 ${iconTone}`}>
            <TriangleAlert className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            {/* WHY — the plain-English reason (backend-computed). */}
            <p className="text-sm font-medium text-foreground">{item.why}</p>
            {/* WHERE — location + staff + when. */}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden />
                {item.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3" aria-hidden />
                {item.staff_name ?? "Unnamed staff"}
              </span>
              {item.created_at && <span>{formatDateTime(item.created_at)}</span>}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-lg tabular-nums text-foreground">
            −{formatCurrency(item.discount)}
          </p>
          {item.discount_pct != null && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatPercent(item.discount_pct)} off
            </p>
          )}
        </div>
      </div>

      {/* ACTION — review + email the person in charge, in-app, then track it. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        {item.manager_email ? (
          <Button size="sm" variant={item.sent_at ? "outline" : "default"} asChild>
            <Link href={`/discounts/attention/send/${item.order_id}`}>
              <Mail className="size-4" aria-hidden />
              {item.sent_at ? `Email ${item.location} manager again` : `Email ${item.location} manager`}
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={recipientSettingsHref({ kind: "location", locationId: item.location_id }, pathname)}>
              <Mail className="size-4" aria-hidden />
              Add a manager email to act
            </Link>
          </Button>
        )}
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/discounts/transactions/${item.order_id}`}>
            <ShoppingBag className="size-4" aria-hidden />
            View order {item.order_number}
          </Link>
        </Button>
        {item.sent_at && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Emailed {formatDateTime(item.sent_at)}
          </span>
        )}
      </div>
    </Card>
  );
}

/** The supervision queue (SPEC-142): flagged discounts as State · Reason · Action
 * cards, paginated. Each card explains WHY + WHERE and gives a one-click email to
 * the location's manager. */
export function AttentionQueue({
  items,
  counts,
}: {
  items: DiscountAttentionItem[];
  counts: { red: number; yellow: number };
}) {
  const [page, setPage] = useState(0);
  const [location, setLocation] = useState("all");
  const [severity, setSeverity] = useState<"all" | "red" | "yellow">("all");
  const [timeframe, setTimeframe] = useState<"all" | "24h" | "7d" | "30d">("all");
  const [sort, setSort] = useState<"urgent" | "newest" | "amount">("urgent");
  // Snapshot "now" once at mount — keeps render pure (no Date.now() in the body).
  const [now] = useState(() => Date.now());

  const locations = useMemo(
    () => [...new Set(items.map((i) => i.location))].sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const WINDOW_MS: Record<"24h" | "7d" | "30d", number> = {
    "24h": 86_400_000,
    "7d": 7 * 86_400_000,
    "30d": 30 * 86_400_000,
  };
  const cutoff = timeframe === "all" ? 0 : now - WINDOW_MS[timeframe];

  const filtered = items
    .filter(
      (i) =>
        (location === "all" || i.location === location) &&
        (severity === "all" || i.severity === severity) &&
        (timeframe === "all" || (i.created_at != null && Date.parse(i.created_at) >= cutoff)),
    )
    // "urgent" keeps the backend order (red first, then $); the others re-sort.
    .sort((a, b) => {
      if (sort === "newest") {
        return (b.created_at ? Date.parse(b.created_at) : 0) -
          (a.created_at ? Date.parse(a.created_at) : 0);
      }
      if (sort === "amount") return b.discount - a.discount;
      return 0;
    });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  const SEVERITIES: { id: "all" | "red" | "yellow"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "red", label: "Urgent" },
    { id: "yellow", label: "Review" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-card p-4 ring-1 ring-foreground/10">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {location === "all" && severity === "all" && timeframe === "all"
              ? `${formatNumber(items.length)} discount${items.length === 1 ? "" : "s"} need a look`
              : `${formatNumber(filtered.length)} of ${formatNumber(items.length)} shown`}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium text-destructive">{counts.red} urgent</span> ·{" "}
            <span className="font-medium text-warning">{counts.yellow} to review</span> — email the
            responsible location manager to confirm the reason.
          </p>
        </div>

        {/* Filters — narrow the queue by severity + location. */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="radiogroup"
            aria-label="Filter by urgency"
            className="inline-flex gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
          >
            {SEVERITIES.map(({ id, label }) => {
              const active = severity === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSeverity(id);
                    setPage(0);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Select
            value={location}
            onValueChange={(v) => {
              setLocation(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={timeframe}
            onValueChange={(v) => {
              setTimeframe(v as "all" | "24h" | "7d" | "30d");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="Any time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as "urgent" | "newest" | "amount");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Most urgent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Most urgent</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="amount">Largest discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-card border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No discounts match these filters.
        </p>
      ) : (
        <div className="space-y-3">
          {slice.map((item) => (
            <AttentionCard key={item.order_id} item={item} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of{" "}
            {formatNumber(filtered.length)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(current - 1)} disabled={current === 0}>
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {current + 1} / {pages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

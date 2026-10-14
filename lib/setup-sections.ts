/**
 * Setup's store and brand sections (SPEC-362) — pure.
 *
 * A new company's Setup reads, top to bottom: **Your store** (the first sync's steps, the running
 * one saying what it is loading), **Your brand** (the Brand Brain research — waiting, running, then
 * ready to review), and **Your apps** (SPEC-360/361). One progress bar counts all three.
 */
import { foundSummary, foundTotal, researchLines, researchToastView, stepPosition, type ResearchLine } from "@/lib/brand-research";
import { syncSteps, type BootstrapDetail, type BootstrapPayload, type SyncStepState } from "@/lib/onboarding";
import type { Checklist } from "@/lib/setup-checklist";
import type { ResearchRun } from "@/types/brand-research";
import { formatNumber } from "@/utils/format";

/** What each Shopify resource and each first-sync job is, in words (backend SPEC-370). */
const DOING: Readonly<Record<string, string>> = {
  customers: "Customers",
  orders: "Orders",
  products: "Products",
  collections: "Collections",
  inventory: "Stock",
  discounts: "Discounts",
  costs: "Product costs",
  inventory_reconciliation: "Counting stock at every location",
  order_journey_sync: "Tracing where orders came from",
  landed_cost_resolve: "Working out landed costs",
  inventory_commentary_warm: "Reading your stock",
  stockout_predict: "Predicting stock-outs",
  season_forecast: "Forecasting the season",
  tax_reports: "Preparing sales and tax",
  spotlight_nightly: "Finding search topics",
  daily_report: "Writing yesterday's report",
};

/** Resources whose count is worth saying ("Customers 1,240"); jobs report none. */
const COUNTED: ReadonlySet<string> = new Set(["customers", "orders", "products", "collections", "inventory", "discounts", "costs"]);

export function doing(key: string): string {
  return DOING[key] ?? key.replace(/_/g, " ");
}

/** "Loading orders · Customers 1,240 ✓" — what the running step is doing right now. */
export function detailText(detail: BootstrapDetail | null | undefined): string | null {
  if (!detail) return null;
  const now = COUNTED.has(detail.now) ? `Loading ${doing(detail.now).toLowerCase()}` : doing(detail.now);
  const finished = Object.entries(detail.done)
    .filter(([key]) => COUNTED.has(key))
    .map(([key, count]) => (count < 0 ? `${doing(key)} failed` : `${doing(key)} ${formatNumber(count)} ✓`));
  return [now, ...finished].join(" · ");
}

export interface StoreLine {
  key: string;
  title: string;
  state: SyncStepState;
  /** The running step's live note; the failed step's reason. */
  note: string | null;
}

export interface StoreSection {
  state: "running" | "done" | "failed";
  title: string;
  lines: StoreLine[];
  done: number;
  total: number;
}

/** The store's first sync as Setup lines, or null when there is none to show (a store that had
 * synced before this session, or no store). */
export function storeSection(payload: BootstrapPayload | null): StoreSection | null {
  if (!payload) return null;
  const steps = syncSteps(payload);
  const running = steps.findIndex((s) => s.state === "running");
  const lines = steps.map((s) => ({
    key: s.key,
    title: s.title,
    state: s.state,
    note:
      s.state === "running"
        ? detailText(payload.detail)
        : s.state === "failed"
          ? (payload.error ?? "It stopped before it finished.")
          : null,
  }));
  const done = lines.filter((l) => l.state === "done").length;
  const state = payload.state === "failed" ? "failed" : payload.state === "done" ? "done" : "running";
  const title =
    state === "done"
      ? "Your store is loaded"
      : state === "failed"
        ? "Loading your store stopped"
        : `Loading your store · step ${(running === -1 ? done : running) + 1} of ${lines.length}`;
  return { state, title, lines, done, total: lines.length };
}

export type BrandState = "waiting" | "running" | "review" | "finished" | "failed";

export interface BrandSection {
  state: BrandState;
  title: string;
  note: string;
  /** 0–100 while running. */
  progress: number;
  /** A Review button is offered. */
  canReview: boolean;
  /** SPEC-367: every step, live — shown while it runs, folded away once it has finished. */
  lines: ResearchLine[];
  /** "4 of 9 done · 3 working" while it runs, else null. */
  position: string | null;
}

/**
 * The Brand Brain research as Setup's one brand line, or null. It waits while the store loads
 * (the research starts once the store has), follows the run live, and stays once finished until
 * the run is seen — opening the review marks it seen.
 */
export function researchSection(run: ResearchRun | null, store: StoreSection | null): BrandSection | null {
  if (!run) {
    if (store?.state === "running") {
      return {
        state: "waiting",
        title: "Brand Brain research",
        note: "Starts when your store has loaded: it reads your site, your customers, your reviews and your photos.",
        progress: 0,
        canReview: false,
        lines: [],
        position: null,
      };
    }
    return null;
  }
  if (run.status !== "running" && run.seenAt) return null;
  const view = researchToastView(run);
  const lines = researchLines(run);
  const position = stepPosition(run);
  if (run.status === "running") {
    return { state: "running", title: view.title, note: view.summary, progress: view.progress, canReview: false, lines, position };
  }
  if (run.status === "failed") {
    return { state: "failed", title: view.title, note: view.summary, progress: view.progress, canReview: view.canReview, lines, position };
  }
  const found = foundTotal(run.found) > 0;
  return {
    state: found ? "review" : "finished",
    title: view.title,
    note: foundSummary(run.found),
    progress: 100,
    canReview: found,
    lines,
    position,
  };
}

export interface SetupProgress {
  done: number;
  total: number;
  percent: number;
  /** Anything left — Setup is drawn only while true. */
  open: boolean;
}

/** One bar for the three sections: store steps done, the brand line once seen (it is never
 * counted done while it waits, runs or asks for review), and the apps once synced. */
export function setupProgress(store: StoreSection | null, brand: BrandSection | null, apps: Checklist | null): SetupProgress {
  const brandDone = brand?.state === "finished" ? 1 : 0;
  const done = (store?.done ?? 0) + brandDone + (apps?.done ?? 0);
  const total = (store?.total ?? 0) + (brand ? 1 : 0) + (apps?.total ?? 0);
  const storeLeft = store !== null && store.state !== "done";
  const brandLeft = brand !== null && brand.state !== "finished";
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    open: storeLeft || brandLeft || apps !== null,
  };
}

/** The milestones Setup opens itself for — the store's and the brand's overall states. A step
 * moving inside the store's sync is not one, so a list the person closed stays closed. */
export function milestones(store: StoreSection | null, brand: BrandSection | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (store) out["store"] = store.state;
  if (brand && brand.state !== "waiting") out["brand"] = brand.state;
  return out;
}

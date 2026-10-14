"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PauseCircle, X } from "lucide-react";

import { FolderPanel } from "@/components/shared/folder-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeBreadcrumb } from "@/features/employees/employee-breadcrumb";
import { AdsTabs } from "@/features/ads/ads-tabs";
import { BudgetStrip } from "@/features/ads/budget-strip";
import { useCan } from "@/hooks/use-can";
import { normalizeAdsTab } from "@/lib/ads";
import { cn } from "@/lib/utils";
import { setKillSwitch } from "@/services/ads-actions";
import type { BudgetSummary } from "@/types/ads";

/**
 * Persistent Performance Ads shell (SPEC-111), rendered from the ads
 * `layout.tsx` so the header, the budget/guardrail strip, and the tab bar stay
 * mounted across tab switches — only `{children}` (the active tab, behind a
 * keyed `<Suspense>`) re-renders and shows its own content-only skeleton.
 * Mirrors the Spotlight / Social shell.
 *
 * The kill-switch is REAL (SPEC-183): it is seeded from `budget.killSwitchActive` —
 * the backend's truth, so it survives a reload — and toggling it calls
 * `POST /ads/kill-switch`, which pauses every live campaign and blocks every
 * subsequent approval.
 *
 * It previously held `paused` in local `useState` with no backend at all. On the one
 * control that halts all spending, a toggle that reports success it did not achieve is
 * the most dangerous thing on the page, so a failed call now leaves the switch exactly
 * where it was and shows the error instead.
 */
export function AdsShell({
  budget,
  children,
}: {
  budget: BudgetSummary;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const router = useRouter();
  const can = useCan();
  const stopGate = can("ads.manage");

  // NOT local state. The stop state has exactly one source of truth — the backend —
  // and `budget` is re-fetched by `router.refresh()` after every toggle. Mirroring it
  // into `useState` is what made the old control lie: it forgot on reload and could
  // disagree with the server after a guardrail or another session changed it.
  const paused = budget.killSwitchActive;

  const toggle = useCallback(() => {
    const next = !paused;
    setError(null);
    startTransition(async () => {
      try {
        await setKillSwitch(
          next,
          next ? "Operator stopped all ad spend." : "Operator released the stop.",
        );
        setToast(
          next
            ? "All ad spend stopped. Every live campaign is paused and no approval will go through."
            : "Stop released. Campaigns stay paused — each one must be approved again before it spends.",
        );
        // The server is the source of truth for the toggle's position.
        router.refresh();
      } catch (cause) {
        // The switch does not move: never show "stopped" for a call that failed.
        setError(cause instanceof Error ? cause.message : "That did not go through.");
      }
    });
  }, [paused, router]);

  // Auto-dismiss the toast; a paused banner (below) carries the persistent state.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (pathname !== "/ads") return <>{children}</>;

  const active = normalizeAdsTab(searchParams.get("tab"));

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <EmployeeBreadcrumb current="Paid Ads Manager" />
        <PageHeader
          title="Paid Ads Manager"
          description="Your AI media buyer for Meta and Google. It proposes profit-aware campaigns grounded in your Shopify data, but never spends on its own — you approve every launch and budget raise, and hard caps plus a kill-switch keep every dollar accountable."
        />
      </div>

      <BudgetStrip
        budget={budget}
        paused={paused}
        onToggle={toggle}
        busy={busy}
        error={error}
        toggleBlockedReason={stopGate.allowed ? null : stopGate.reason}
      />

      {paused && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-card border border-warning/30 bg-warning/10 p-3 text-sm font-medium text-warning"
        >
          <PauseCircle className="size-4 shrink-0" aria-hidden />
          Spend is paused across all channels. Resume from the budget strip when
          you&apos;re ready — nothing spends in the meantime.
        </div>
      )}

      <div>
        <AdsTabs active={active} />
        <FolderPanel>
          {children}

          {toast && (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3",
                "rounded-card border border-border bg-card p-4 shadow-lg",
              )}
            >
              <span className="min-w-0 flex-1 text-sm text-foreground">{toast}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </FolderPanel>
      </div>
    </main>
  );
}

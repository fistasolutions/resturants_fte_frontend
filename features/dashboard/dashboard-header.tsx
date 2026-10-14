import { StoreSwitcher } from "@/components/layout/store-switcher";
import { DateRangePicker } from "@/features/dashboard/date-range-picker";
import type { RangePreset } from "@/lib/date-range";
import type { StoreConnection } from "@/types/store";

interface DashboardHeaderProps {
  greeting: string;
  userName: string;
  store: StoreConnection;
  from: string;
  to: string;
  preset: RangePreset | null;
  periodLabel: string;
}

export function DashboardHeader({
  greeting,
  userName,
  store,
  from,
  to,
  preset,
  periodLabel,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl tracking-wide md:text-3xl">
          {greeting}, {userName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StoreSwitcher store={store} />
        <DateRangePicker
          from={from}
          to={to}
          preset={preset}
          label={periodLabel}
          basePath="/dashboard"
        />
      </div>
    </div>
  );
}

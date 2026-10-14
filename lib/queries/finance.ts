/**
 * Finance Oversight reads (SPEC-299, one entry per tab since SPEC-301), through the
 * client cache (SPEC-230).
 *
 * **The payable is read whole, once, and narrowed in the browser.** `GET /finance/ap`
 * can filter — that is the contract other consumers use — but the Overview and Bills
 * tabs ask for all of it and narrow with `filterBills`: a store's unpaid bills are
 * hundreds of rows, and keying the query by the filters made every tile click a round
 * trip. The run and the cash view ARE keyed by their one parameter, because the backend
 * does real work for each (a different through date, a different company's takings).
 */
import {
  toAgingReport,
  toBillDetail,
  toCashOutlook,
  toConnections,
  toFinanceOverview,
  toFinanceProfile,
  toFinanceValue,
  toRunPlan,
  toVendorDetail,
  toVendorsReport,
  type ApiAging,
  type ApiBillDetail,
  type ApiCash,
  type ApiConnections,
  type ApiFinanceAp,
  type ApiProfile,
  type ApiRun,
  type ApiValue,
  type ApiVendorDetail,
  type ApiVendors,
} from "@/lib/finance-api";
import { defineQuery } from "@/lib/query-def";
import type {
  AgingReport,
  BillDetail,
  CashOutlook,
  ConnectionsOverview,
  FinanceOverview,
  FinanceProfile,
  FinanceValue,
  RunPlan,
  RunThrough,
  VendorDetail,
  VendorsReport,
} from "@/types/finance";

export const FINANCE_KEY = ["finance"] as const;

export const financePaths = {
  ap: (): string => "/finance/ap",
  connections: (): string => "/finance/connections",
  bill: (id: string): string => `/finance/bills/${encodeURIComponent(id)}`,
  run: (through: RunThrough): string => `/finance/run?through=${through}`,
  cash: (company: string): string => `/finance/cash?company=${encodeURIComponent(company)}`,
  aging: (): string => "/finance/aging",
  vendors: (): string => "/finance/vendors",
  vendor: (key: string): string => `/finance/vendors/${encodeURIComponent(key)}`,
  profile: (): string => "/finance/profile",
  value: (month: string | null): string => (month ? `/finance/value?month=${month}` : "/finance/value"),
} as const;

export const financeQueries = {
  ap: () =>
    defineQuery<FinanceOverview>([...FINANCE_KEY, "ap"], async (api) =>
      toFinanceOverview(await api<ApiFinanceAp>(financePaths.ap())),
    ),
  connections: () =>
    defineQuery<ConnectionsOverview>([...FINANCE_KEY, "connections"], async (api) =>
      toConnections(await api<ApiConnections>(financePaths.connections())),
    ),
  bill: (id: string) =>
    defineQuery<BillDetail>([...FINANCE_KEY, "bill", id], async (api) =>
      toBillDetail(await api<ApiBillDetail>(financePaths.bill(id))),
    ),
  run: (through: RunThrough) =>
    defineQuery<RunPlan>([...FINANCE_KEY, "run", through], async (api) =>
      toRunPlan(await api<ApiRun>(financePaths.run(through))),
    ),
  cash: (company: string) =>
    defineQuery<CashOutlook>([...FINANCE_KEY, "cash", company], async (api) =>
      toCashOutlook(await api<ApiCash>(financePaths.cash(company))),
    ),
  aging: () =>
    defineQuery<AgingReport>([...FINANCE_KEY, "aging"], async (api) =>
      toAgingReport(await api<ApiAging>(financePaths.aging())),
    ),
  vendors: () =>
    defineQuery<VendorsReport>([...FINANCE_KEY, "vendors"], async (api) =>
      toVendorsReport(await api<ApiVendors>(financePaths.vendors())),
    ),
  vendor: (key: string) =>
    defineQuery<VendorDetail>([...FINANCE_KEY, "vendor", key], async (api) =>
      toVendorDetail(await api<ApiVendorDetail>(financePaths.vendor(key))),
    ),
  profile: () =>
    defineQuery<FinanceProfile>([...FINANCE_KEY, "profile"], async (api) =>
      toFinanceProfile(await api<ApiProfile>(financePaths.profile())),
    ),
  /** SPEC-330: one month of value; `null` is the current month. */
  value: (month: string | null) =>
    defineQuery<FinanceValue>([...FINANCE_KEY, "value", month ?? "current"], async (api) =>
      toFinanceValue(await api<ApiValue>(financePaths.value(month))),
    ),
} as const;

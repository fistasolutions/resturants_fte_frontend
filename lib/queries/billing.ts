/**
 * Billing & plan (SPEC-324 over backend SPEC-331): the plans, the subscription, the AI allowance
 * and the invoices — four independent reads the Billing tab starts together.
 */
import {
  toInvoice,
  toTopupPacks,
  type ApiAllowance,
  type ApiInvoice,
  type ApiPlans,
  type ApiSubscription,
  type ApiTopupPacks,
  type InvoiceView,
  type TopupPack,
} from "@/lib/billing-settings";
import { defineQuery } from "@/lib/query-def";

export const billingPaths = {
  plans: (): string => "/plans",
  subscription: (): string => "/billing/subscription",
  allowance: (): string => "/billing/ai-allowance",
  invoices: (): string => "/billing/invoices",
  topupPacks: (): string => "/billing/ai-topup/packs",
} as const;

export const billingQueries = {
  plans: () => defineQuery<ApiPlans>(["billing", "plans"], (api) => api<ApiPlans>(billingPaths.plans())),
  subscription: () =>
    defineQuery<ApiSubscription | null>(["billing", "subscription"], async (api) =>
      (await api<{ subscription: ApiSubscription | null }>(billingPaths.subscription())).subscription,
    ),
  allowance: () =>
    defineQuery<ApiAllowance>(["billing", "allowance"], (api) => api<ApiAllowance>(billingPaths.allowance())),
  invoices: () =>
    defineQuery<InvoiceView[]>(["billing", "invoices"], async (api) =>
      (await api<{ invoices: ApiInvoice[] }>(billingPaths.invoices())).invoices.map(toInvoice),
    ),
  topupPacks: () =>
    defineQuery<TopupPack[]>(["billing", "topup-packs"], async (api) =>
      toTopupPacks(await api<ApiTopupPacks>(billingPaths.topupPacks())),
    ),
} as const;

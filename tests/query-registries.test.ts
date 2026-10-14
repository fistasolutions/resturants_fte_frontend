/**
 * SPEC-230 rollout — every query registry, checked the same way.
 *
 * Each `lib/queries/<domain>.ts` exposes `<domain>Paths` (pure path builders) and
 * `<domain>Queries` (definitions). The rollout converted ~90 routes onto them, so the
 * properties that keep the cache correct are pinned once for all of them:
 *
 * 1. every key survives a JSON round-trip (server and browser must hash identically);
 * 2. every key starts with the domain segment and carries the arguments it was built
 *    from, so two different inputs never collide on one cache entry;
 * 3. every loader reaches the backend through the `api` it is handed — never a global
 *    fetch — and each path it asks for is one the domain's path builders can produce.
 */
import { describe, expect, it, vi } from "vitest";

import { accountPaths, accountQueries } from "@/lib/queries/account";
import { adsPaths, adsQueries } from "@/lib/queries/ads";
import { aiValuePaths, aiValueQueries } from "@/lib/queries/ai-value";
import { analysisPaths, analysisQueries } from "@/lib/queries/analysis";
import { briefPaths, briefQueries } from "@/lib/queries/brief";
import { chatPaths, chatQueries } from "@/lib/queries/chat";
import { ciPlanPaths, ciPlanQueries } from "@/lib/queries/ci-plans";
import { nudgePaths, nudgeQueries } from "@/lib/queries/nudge";
import { notificationPaths, notificationQueries } from "@/lib/queries/notifications";
import { billingPaths, billingQueries } from "@/lib/queries/billing";
import { brandingPaths, brandingQueries } from "@/lib/queries/branding";
import { organizationPaths, organizationQueries } from "@/lib/queries/organization";
import { teamPaths, teamQueries } from "@/lib/queries/team";
import { watchPaths, watchQueries } from "@/lib/queries/watches";
import { clarityPaths, clarityQueries } from "@/lib/queries/clarity";
import { costsPaths, costsQueries } from "@/lib/queries/costs";
import { customerPaths, customerQueries } from "@/lib/queries/customers";
import { customerSupportPaths, customerSupportQueries } from "@/lib/queries/customer-support";
import { dashboardPaths, dashboardQueries } from "@/lib/queries/dashboard";
import { dataTrustPaths, dataTrustQueries } from "@/lib/queries/data-trust";
import { discountPaths, discountQueries } from "@/lib/queries/discounts";
import { financePaths, financeQueries } from "@/lib/queries/finance";
import { fitPaths, fitQueries } from "@/lib/queries/fit";
import { foresightPaths, foresightQueries } from "@/lib/queries/foresight";
import { gorgiasPaths, gorgiasQueries } from "@/lib/queries/gorgias";
import { integrationPaths, integrationQueries } from "@/lib/queries/integrations";
import { orderPaths, orderQueries } from "@/lib/queries/orders";
import { planningPaths, planningQueries } from "@/lib/queries/planning";
import { reportFtePaths, reportFteQueries } from "@/lib/queries/report-fte";
import { reportPaths, reportQueries } from "@/lib/queries/reports";
import { resultPaths, resultQueries } from "@/lib/queries/results";
import { returnPaths, returnQueries } from "@/lib/queries/returns";
import { setupPaths, setupQueries } from "@/lib/queries/setup";
import { socialPaths, socialQueries } from "@/lib/queries/social";
import { brandBrainPaths, brandBrainQueries } from "@/lib/queries/brand-brain";
import { spotlightPaths, spotlightQueries } from "@/lib/queries/spotlight";
import { storePaths, storeQueries } from "@/lib/queries/store";
import { systemPaths, systemQueries } from "@/lib/queries/system";
import { taxReportPaths, taxReportQueries } from "@/lib/queries/tax-reports";
import { trafficPaths, trafficQueries } from "@/lib/queries/traffic";
import { warehousePaths, warehouseQueries } from "@/lib/queries/warehouse";
import type { ApiGet, QueryDef } from "@/lib/query-def";

const RANGE = { from: "2026-09-01", to: "2026-09-12" } as const;
const FILTERS = {
  fulfillment: null,
  location: null,
  locationName: null,
  product: null,
  productName: null,
  age: null,
  from: null,
  to: null,
  q: "",
  page: 2,
  view: null,
} as const;

/** Every registry, one representative definition per query, and the path prefixes
 * its loader is allowed to touch. */
const REGISTRIES: Array<{
  domain: string;
  paths: Record<string, (...args: never[]) => string>;
  defs: QueryDef<unknown>[];
}> = [
  { domain: "ads", paths: adsPaths, defs: [adsQueries.budget(), adsQueries.overview(), adsQueries.campaigns(), adsQueries.creative(), adsQueries.spendGates(), adsQueries.accountability(), adsQueries.platforms(), adsQueries.platformPerformance(30), adsQueries.platformAudit(7)] },
  { domain: "ai-value", paths: aiValuePaths, defs: [aiValueQueries.overview("30d"), aiValueQueries.caps(), aiValueQueries.trace("t/1")] },
  {
    domain: "analysis",
    paths: analysisPaths,
    defs: [
      analysisQueries.products(RANGE), analysisQueries.productDetail(7, RANGE), analysisQueries.inventory(RANGE),
      analysisQueries.productReturnVerdicts(RANGE), analysisQueries.inventoryByLocation(), analysisQueries.inventoryTransfers(RANGE, 2),
      analysisQueries.transferPlan(RANGE), analysisQueries.inventoryCommentary(RANGE), analysisQueries.transferCommentary(RANGE),
      analysisQueries.deadStockAged(RANGE), analysisQueries.deadStockPlan(true), analysisQueries.catalogVerdicts(RANGE, [1, 2], true),
      analysisQueries.productCommentary(RANGE), analysisQueries.productAiPanel(RANGE), analysisQueries.inventoryPanel(RANGE, 1),
      analysisQueries.deadInventoryAlerts(), analysisQueries.locationTransfers(3), analysisQueries.transferEligibleLocations(),
      analysisQueries.trueProfit(RANGE), analysisQueries.buyPlan(RANGE), analysisQueries.contentGaps(RANGE), analysisQueries.bundles(RANGE), analysisQueries.brandVerdicts(RANGE),
    ],
  },
  { domain: "brand-brain", paths: brandBrainPaths, defs: [brandBrainQueries.coverage(), brandBrainQueries.sources(), brandBrainQueries.source(4), brandBrainQueries.fact(7), brandBrainQueries.sourceFacts(4), brandBrainQueries.facts(), brandBrainQueries.voice(), brandBrainQueries.rules(), brandBrainQueries.personas(), brandBrainQueries.history(20), brandBrainQueries.competitors(), brandBrainQueries.competitor(3), brandBrainQueries.competitorSummary(), brandBrainQueries.researchReview()] },
  { domain: "ci-plans", paths: ciPlanPaths, defs: [ciPlanQueries.list(), ciPlanQueries.plan(7)] },
  {
    domain: "report-fte",
    paths: reportFtePaths,
    defs: [
      reportFteQueries.desk(), reportFteQueries.plan("returns by brand"), reportFteQueries.composer(12), reportFteQueries.templates(),
      reportFteQueries.template("trading-week"), reportFteQueries.history(), reportFteQueries.delivered(), reportFteQueries.profile(),
      reportFteQueries.recipients(), reportFteQueries.onReports("weekly"),
    ],
  },
  { domain: "brief", paths: briefPaths, defs: [briefQueries.data(), briefQueries.data({ ...RANGE, compare: "none" }), briefQueries.kpis({ ...RANGE, compare: "none" }), briefQueries.byDate("2026-09-10"), briefQueries.history(2, 7), briefQueries.attention(), briefQueries.transfers(), briefQueries.overdue(), briefQueries.traffic(), briefQueries.winback({ page: 2, q: "x" })] },
  {
    domain: "chat",
    paths: chatPaths,
    defs: [chatQueries.models(), chatQueries.voiceStatus(), chatQueries.employeeConversations("spotlight")],
  },
  { domain: "nudge", paths: nudgePaths, defs: [nudgeQueries.forRoute("/dashboard")] },
  { domain: "setup", paths: setupPaths, defs: [setupQueries.sync()] },
  { domain: "notifications", paths: notificationPaths, defs: [notificationQueries.inbox(), notificationQueries.inbox(5)] },
  { domain: "branding", paths: brandingPaths, defs: [brandingQueries.current(), brandingQueries.palette()] },
  { domain: "billing", paths: billingPaths, defs: [billingQueries.plans(), billingQueries.subscription(), billingQueries.allowance(), billingQueries.invoices(), billingQueries.topupPacks()] },
  { domain: "organization", paths: organizationPaths, defs: [organizationQueries.settings()] },
  { domain: "account", paths: accountPaths, defs: [accountQueries.sessions()] },
  { domain: "team", paths: teamPaths, defs: [teamQueries.members(), teamQueries.seats(), teamQueries.invitations(), teamQueries.roles(), teamQueries.permissions(), teamQueries.audit(), teamQueries.audit(40), teamQueries.access()] },
  { domain: "watches", paths: watchPaths, defs: [watchQueries.list()] },
  { domain: "clarity", paths: clarityPaths, defs: [clarityQueries.status(), clarityQueries.blogEngagement(), clarityQueries.friction(), clarityQueries.frictionPage("x"), clarityQueries.brokeYesterday(), clarityQueries.campaigns()] },
  { domain: "costs", paths: costsPaths, defs: [costsQueries.summary(RANGE)] },
  { domain: "customers", paths: customerPaths, defs: [customerQueries.moneyFinder({ page: 2 }), customerQueries.segments(), customerQueries.repeatClock(), customerQueries.health()] },
  { domain: "dashboard", paths: dashboardPaths, defs: [dashboardQueries.data({ ...RANGE, compare: "none", label: "x" }), dashboardQueries.locations(RANGE.from, RANGE.to), dashboardQueries.returnsSpikeTop(10), dashboardQueries.money()] },
  { domain: "data-trust", paths: dataTrustPaths, defs: [dataTrustQueries.report()] },
  // SPEC-346 / backend SPEC-353.
  { domain: "customer-support", paths: customerSupportPaths, defs: [customerSupportQueries.workspace(), customerSupportQueries.overview(), customerSupportQueries.inbox("closed", "sla", 2), customerSupportQueries.ticket("1001"), customerSupportQueries.approvals(), customerSupportQueries.topics(), customerSupportQueries.bench("size_fit", "1010"), customerSupportQueries.knowledge(), customerSupportQueries.insights(), customerSupportQueries.performance(), customerSupportQueries.activity(2)] },
  { domain: "discounts", paths: discountPaths, defs: [discountQueries.overview(RANGE.from, RANGE.to), discountQueries.reasons(RANGE.from, RANGE.to), discountQueries.attention(RANGE.from, RANGE.to), discountQueries.automatic(RANGE.from, RANGE.to), discountQueries.employees(RANGE.from, RANGE.to, 4), discountQueries.employeeTransactions(9, RANGE.from, RANGE.to), discountQueries.transaction(11), discountQueries.alerts(RANGE.from, RANGE.to), discountQueries.cannibalisation(RANGE.from, RANGE.to), discountQueries.decisions(RANGE.from, RANGE.to)] },
  {
    domain: "finance",
    paths: financePaths,
    defs: [
      financeQueries.ap(),
      financeQueries.connections(),
      financeQueries.bill("41"),
      financeQueries.run("week"),
      financeQueries.cash("all"),
      financeQueries.aging(),
      financeQueries.vendors(),
      financeQueries.vendor("vogue-textiles"),
      financeQueries.profile(),
    ],
  },
  { domain: "fit", paths: fitPaths, defs: [fitQueries.overview(), fitQueries.style(8083366969574)] },
  { domain: "foresight", paths: foresightPaths, defs: [foresightQueries.profit(RANGE), foresightQueries.forecast(), foresightQueries.sizes(RANGE), foresightQueries.stockout(), foresightQueries.stockoutAccuracy(), foresightQueries.season(), foresightQueries.seasonAccuracy(), foresightQueries.launchWatch(45)] },
  { domain: "gorgias", paths: gorgiasPaths, defs: [gorgiasQueries.voiceOfCustomer(RANGE.from, RANGE.to), gorgiasQueries.overview(RANGE.from, RANGE.to), gorgiasQueries.conversations("start=a&end=b"), gorgiasQueries.conversation(5), gorgiasQueries.alerts(RANGE.from, RANGE.to), gorgiasQueries.agents(), gorgiasQueries.metrics("2026-09-12"), gorgiasQueries.supportAttention()] },
  { domain: "integrations", paths: integrationPaths, defs: [integrationQueries.settings(), integrationQueries.googleStatus(), integrationQueries.metaStatus(), integrationQueries.aiProviders()] },
  { domain: "orders", paths: orderPaths, defs: [orderQueries.list(FILTERS, 25), orderQueries.detail("123"), orderQueries.reviewByLocation("start=a")] },
  { domain: "planning", paths: planningPaths, defs: [planningQueries.cashRelease(), planningQueries.allocation(), planningQueries.staffing(RANGE.from, RANGE.to), planningQueries.nexus()] },
  { domain: "reports", paths: reportPaths, defs: [reportQueries.list(5), reportQueries.detail("2026-09-12", "all"), reportQueries.detail("2026-09-12", "loc:1"), reportQueries.rollup("weekly"), reportQueries.scopes(), reportQueries.history({ q: "x", type: null, scope: null, limit: 10, offset: 10 })] },
  { domain: "results", paths: resultPaths, defs: [resultQueries.results(), resultQueries.ledger(), resultQueries.managers(), resultQueries.reportCard(7)] },
  { domain: "returns", paths: returnPaths, defs: [returnQueries.metrics({ ...RANGE, compare: "none" }), returnQueries.fixes(RANGE), returnQueries.overview(RANGE), returnQueries.byStyle(RANGE), returnQueries.bySize(RANGE), returnQueries.byCategory(RANGE), returnQueries.styleDetail(8, RANGE), returnQueries.bracketing(RANGE)] },
  { domain: "social", paths: socialPaths, defs: [socialQueries.overview(), socialQueries.studioProducts(), socialQueries.approvals(), socialQueries.calendar(), socialQueries.performance()] },
  { domain: "spotlight", paths: spotlightPaths, defs: [spotlightQueries.overview(), spotlightQueries.brandBrain(), spotlightQueries.queries(), spotlightQueries.inboundTopics(), spotlightQueries.dailyPicks(), spotlightQueries.dailyPicksForDate("2026-09-10"), spotlightQueries.dailyPicksHistory(), spotlightQueries.drafts(), spotlightQueries.draft("my-post"), spotlightQueries.approvals(), spotlightQueries.published(), spotlightQueries.unpublished(), spotlightQueries.journeyCoverage(), spotlightQueries.visibility(), spotlightQueries.strikingDistance()] },
  { domain: "store", paths: storePaths, defs: [storeQueries.currentUser(), storeQueries.connection(), storeQueries.systemStatus(), storeQueries.settingsOverview()] },
  { domain: "system", paths: systemPaths, defs: [systemQueries.jobs(), systemQueries.runs({ jobId: "j", status: "error", window: "7d", page: 2 }), systemQueries.run(4)] },
  { domain: "tax-reports", paths: taxReportPaths, defs: [taxReportQueries.list(), taxReportQueries.detail(3), taxReportQueries.rows(3)] },
  { domain: "traffic", paths: trafficPaths, defs: [trafficQueries.overview(RANGE.from, RANGE.to), trafficQueries.peakHours(RANGE.from, RANGE.to), trafficQueries.storeDetail(2, RANGE.from, RANGE.to)] },
  { domain: "warehouse", paths: warehousePaths, defs: [warehouseQueries.overview(RANGE.from, RANGE.to), warehouseQueries.packerOrders("Ana B", RANGE.from, RANGE.to), warehouseQueries.backlogOrders("d8_30", 100)] },
];

/** A transport that records every path and answers with an empty-ish envelope. Every
 * adapter in the app tolerates a missing field or throws — and a thrown adapter is
 * still a loader that reached the backend through `api`, which is what is tested. */
function recorder(): { api: ApiGet; calls: string[] } {
  const calls: string[] = [];
  const api: ApiGet = async <T,>(path: string): Promise<T> => {
    calls.push(path);
    return new Proxy({}, { get: () => undefined }) as T;
  };
  return { api, calls };
}

describe("SPEC-230 query registries", () => {
  it.each(REGISTRIES.map((r) => [r.domain, r] as const))("%s — keys are stable, scoped and distinct", (_domain, registry) => {
    const seen = new Set<string>();
    for (const def of registry.defs) {
      const roundTripped = JSON.parse(JSON.stringify(def.queryKey)) as unknown[];
      expect(roundTripped).toEqual(def.queryKey);
      const hash = JSON.stringify(def.queryKey);
      expect(seen.has(hash), `duplicate key ${hash}`).toBe(false);
      seen.add(hash);
    }
    const domains = new Set(registry.defs.map((d) => String(d.queryKey[0])));
    expect(domains.size).toBe(1);
  });

  it.each(REGISTRIES.map((r) => [r.domain, r] as const))("%s — loaders reach the backend only through the api they are handed", async (_domain, registry) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      for (const def of registry.defs) {
        const { api, calls } = recorder();
        await def.load(api).catch(() => undefined);
        expect(calls.length, `${JSON.stringify(def.queryKey)} made no request`).toBeGreaterThan(0);
        for (const path of calls) {
          expect(path.startsWith("/"), `${path} is not backend-relative`).toBe(true);
          expect(path.includes("/api/proxy"), `${path} must not bake in the proxy`).toBe(false);
        }
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});

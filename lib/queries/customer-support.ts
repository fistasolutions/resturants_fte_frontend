/**
 * Customer Support Agent queries (SPEC-346, backend SPEC-353) — defined once for both
 * transports (SPEC-230). The backend answers in camelCase, exactly `types/customer-support.ts`,
 * so no adapter sits between the wire and the page.
 *
 * The connection is not here: it is read through the existing `integrationQueries.overview()`
 * and `.settings()` and `gorgiasQueries.agents()`, shared with the Integrations page.
 */
import { defineQuery } from "@/lib/query-def";
import { approvalsQuery, type ApprovalsView } from "@/lib/support-approvals";
import type { InboxSort } from "@/lib/support-inbox";
import type {
  ActivityPage,
  Approval,
  ApprovalsPage,
  BenchResult,
  InboxPage,
  Insight,
  PerformanceSnapshot,
  QueueKey,
  SupportKnowledge,
  SupportOverview,
  SupportWorkspace,
  TicketDetail,
  TopicKey,
  TopicsData,
} from "@/types/customer-support";

const ROOT = "/customer-support";

export const customerSupportPaths = {
  workspace: (): string => `${ROOT}/workspace`,
  overview: (): string => `${ROOT}/overview`,
  inbox: (queue: QueueKey, sort: InboxSort, page: number): string =>
    `${ROOT}/tickets?${new URLSearchParams({ queue, sort, page: String(page) }).toString()}`,
  ticket: (id: string): string => `${ROOT}/tickets/${encodeURIComponent(id)}`,
  approvals: (): string => `${ROOT}/approvals`,
  approvalsPage: (query: string): string => `${ROOT}/approvals/page${query ? `?${query}` : ""}`,
  topics: (): string => `${ROOT}/topics`,
  bench: (topic: TopicKey, ticketId: string): string =>
    `${ROOT}/topics/${topic}/bench?${new URLSearchParams({ ticket_id: ticketId }).toString()}`,
  knowledge: (): string => `${ROOT}/knowledge`,
  insights: (): string => `${ROOT}/insights`,
  performance: (): string => `${ROOT}/performance`,
  activity: (page: number): string => `${ROOT}/activity?${new URLSearchParams({ page: String(page) }).toString()}`,
} as const;

/** Every customer-support key starts here, so one invalidation refreshes the workspace. */
export const CUSTOMER_SUPPORT_KEY = ["customer-support"] as const;

export const customerSupportQueries = {
  workspace: () =>
    defineQuery<SupportWorkspace>([...CUSTOMER_SUPPORT_KEY, "workspace"], (api) =>
      api<SupportWorkspace>(customerSupportPaths.workspace()),
    ),
  overview: () =>
    defineQuery<SupportOverview>([...CUSTOMER_SUPPORT_KEY, "overview"], (api) =>
      api<SupportOverview>(customerSupportPaths.overview()),
    ),
  inbox: (queue: QueueKey, sort: InboxSort, page: number) =>
    defineQuery<InboxPage>([...CUSTOMER_SUPPORT_KEY, "inbox", { queue, sort, page }], (api) =>
      api<InboxPage>(customerSupportPaths.inbox(queue, sort, page)),
    ),
  ticket: (id: string) =>
    defineQuery<TicketDetail>([...CUSTOMER_SUPPORT_KEY, "ticket", id], (api) =>
      api<TicketDetail>(customerSupportPaths.ticket(id)),
    ),
  /** One filtered page of Approvals (SPEC-349 / backend SPEC-358), keyed by its query. */
  approvalsPage: (view: ApprovalsView) =>
    defineQuery<ApprovalsPage>([...CUSTOMER_SUPPORT_KEY, "approvals-page", approvalsQuery(view)], (api) =>
      api<ApprovalsPage>(customerSupportPaths.approvalsPage(approvalsQuery(view))),
    ),
  approvals: () =>
    defineQuery<Approval[]>([...CUSTOMER_SUPPORT_KEY, "approvals"], (api) =>
      api<Approval[]>(customerSupportPaths.approvals()),
    ),
  topics: () =>
    defineQuery<TopicsData>([...CUSTOMER_SUPPORT_KEY, "topics"], (api) => api<TopicsData>(customerSupportPaths.topics())),
  bench: (topic: TopicKey, ticketId: string) =>
    defineQuery<BenchResult>([...CUSTOMER_SUPPORT_KEY, "bench", topic, ticketId], (api) =>
      api<BenchResult>(customerSupportPaths.bench(topic, ticketId)),
    ),
  knowledge: () =>
    defineQuery<SupportKnowledge>([...CUSTOMER_SUPPORT_KEY, "knowledge"], (api) =>
      api<SupportKnowledge>(customerSupportPaths.knowledge()),
    ),
  insights: () =>
    defineQuery<Insight[]>([...CUSTOMER_SUPPORT_KEY, "insights"], (api) => api<Insight[]>(customerSupportPaths.insights())),
  performance: () =>
    defineQuery<PerformanceSnapshot>([...CUSTOMER_SUPPORT_KEY, "performance"], (api) =>
      api<PerformanceSnapshot>(customerSupportPaths.performance()),
    ),
  activity: (page: number) =>
    defineQuery<ActivityPage>([...CUSTOMER_SUPPORT_KEY, "activity", page], (api) =>
      api<ActivityPage>(customerSupportPaths.activity(page)),
    ),
} as const;

/**
 * Report FTE queries (SPEC-285) — every read the six tabs make, defined once for both
 * transports (SPEC-230) and answered by backend SPEC-283. The composer reads a run by
 * id; writes live in `services/report-fte-actions.ts` and invalidate `["report-fte"]`.
 */
import { defineQuery } from "@/lib/query-def";
import type {
  ComposerData,
  DeliveredData,
  DeskData,
  HistoryData,
  OnReportsData,
  ProfileData,
  RecipientDirectory,
  ScheduleCadence,
  ReportPlan,
  TemplateData,
  TemplatesData,
} from "@/types/report-fte";

export const reportFtePaths = {
  desk: (): string => "/report-fte/desk",
  plan: (ask: string | null): string =>
    ask ? `/report-fte/plan?ask=${encodeURIComponent(ask)}` : "/report-fte/plan",
  run: (runId: number): string => `/report-fte/runs/${runId}`,
  templates: (): string => "/report-fte/templates",
  template: (id: string): string => `/report-fte/templates/${encodeURIComponent(id)}`,
  history: (limit = 50, offset = 0): string => `/report-fte/runs?limit=${limit}&offset=${offset}`,
  delivered: (): string => "/report-fte/delivered",
  profile: (): string => "/report-fte/profile",
  recipients: (): string => "/report-fte/recipients",
  onReports: (cadence: ScheduleCadence): string => `/report-fte/on-reports?cadence=${cadence}`,
} as const;

export const reportFteQueries = {
  desk: () => defineQuery<DeskData>(["report-fte", "desk"], (api) => api<DeskData>(reportFtePaths.desk())),
  plan: (ask: string | null) =>
    defineQuery<ReportPlan>(["report-fte", "plan", ask ?? ""], (api) => api<ReportPlan>(reportFtePaths.plan(ask))),
  composer: (runId: number) =>
    defineQuery<ComposerData>(["report-fte", "run", runId], (api) => api<ComposerData>(reportFtePaths.run(runId))),
  templates: () =>
    defineQuery<TemplatesData>(["report-fte", "templates"], (api) => api<TemplatesData>(reportFtePaths.templates())),
  template: (id: string) =>
    defineQuery<TemplateData>(["report-fte", "template", id], (api) => api<TemplateData>(reportFtePaths.template(id))),
  history: (limit = 50, offset = 0) =>
    defineQuery<HistoryData>(["report-fte", "history", limit, offset], (api) =>
      api<HistoryData>(reportFtePaths.history(limit, offset)),
    ),
  delivered: () =>
    defineQuery<DeliveredData>(["report-fte", "delivered"], (api) => api<DeliveredData>(reportFtePaths.delivered())),
  profile: () => defineQuery<ProfileData>(["report-fte", "profile"], (api) => api<ProfileData>(reportFtePaths.profile())),
  /** SPEC-335: every address the store keeps, for the send and schedule dialogs. */
  recipients: () =>
    defineQuery<RecipientDirectory>(["report-fte", "recipients"], (api) =>
      api<RecipientDirectory>(reportFtePaths.recipients()),
    ),
  /** SPEC-335: scheduled reports shown on the Daily Reports page, by cadence. */
  onReports: (cadence: ScheduleCadence) =>
    defineQuery<OnReportsData>(["report-fte", "on-reports", cadence], (api) =>
      api<OnReportsData>(reportFtePaths.onReports(cadence)),
    ),
} as const;

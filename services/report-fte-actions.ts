/**
 * Report FTE writes (SPEC-285) — client-side, through the proxy, to backend SPEC-283.
 * Reads live in `lib/queries/report-fte.ts`; callers invalidate `["report-fte"]` after a
 * write. `executeRun` is the one stream: it reads the SSE frames of a run and hands
 * each to the caller as it arrives.
 */
import { proxyUrl } from "@/lib/client-api";
import type {
  ComposerData,
  ExecuteEvent,
  ReviseResult,
  ScheduleAuthority,
  ScheduleResult,
  SendResult,
  TemplateData,
  TemplateSectionDef,
} from "@/types/report-fte";

export class ReportFteRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ReportFteRequestError";
  }
}

async function fail(response: Response, fallback: string): Promise<ReportFteRequestError> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
  return new ReportFteRequestError(body?.error?.message ?? `${fallback} (${response.status}).`, response.status, body?.error?.code ?? null);
}

async function post<T>(path: string, body: unknown, fallback: string, method = "POST"): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await fail(response, fallback);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** A draft run with its plan — from an ask, or from a template. */
export async function createRun(input: { ask?: string; templateId?: string }): Promise<ComposerData> {
  return post<ComposerData>("/report-fte/runs", { ask: input.ask ?? null, template_id: input.templateId ?? null }, "Building the plan failed");
}

/**
 * Runs the plan. Resolves with the finished run once the backend sends `done`;
 * rejects on an `error` frame or a closed stream without one.
 */
export async function executeRun(runId: number, onEvent: (event: ExecuteEvent) => void): Promise<ComposerData> {
  const response = await fetch(proxyUrl(`/report-fte/runs/${runId}/execute`), { method: "POST" });
  if (!response.ok || !response.body) throw await fail(response, "Running the plan failed");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done: ComposerData | null = null;
  for (;;) {
    const { done: closed, value } = await reader.read();
    if (closed) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      if (!frame.startsWith("data: ")) continue;
      let parsed: ExecuteEvent;
      try {
        parsed = JSON.parse(frame.slice(6)) as ExecuteEvent;
      } catch {
        continue;
      }
      if (parsed.event === "error") throw new ReportFteRequestError(parsed.message, 500, parsed.code);
      onEvent(parsed);
      if (parsed.event === "done") done = parsed;
    }
  }
  if (!done) throw new ReportFteRequestError("The run ended before the report was ready.", 500, "report_run_incomplete");
  return done;
}

export async function sendRun(runId: number, to?: string[]): Promise<SendResult> {
  return post<SendResult>(`/report-fte/runs/${runId}/send`, { to: to ?? null }, "Sending the report failed");
}

/** SPEC-335: `body` is the schedule dialog's choice (`scheduleBody`); none keeps the template's. */
export async function scheduleRun(runId: number, body?: Record<string, unknown>): Promise<ScheduleResult> {
  return post<ScheduleResult>(`/report-fte/runs/${runId}/schedule`, body, "Scheduling the report failed");
}

export async function recordOutcome(runId: number, actedOn: string): Promise<{ runId: number; actedOn: string | null }> {
  return post(`/report-fte/runs/${runId}/outcome`, { acted_on: actedOn }, "Recording the outcome failed");
}

export async function setScheduleAuthority(scheduleId: string, authority: ScheduleAuthority): Promise<void> {
  await post(`/report-fte/schedules/${scheduleId}`, { authority }, "Changing the schedule failed", "PATCH");
}

export async function pauseAllSchedules(): Promise<{ paused: number }> {
  return post<{ paused: number }>("/report-fte/schedules/pause-all", undefined, "Pausing the schedules failed");
}

export interface TemplateSave {
  sections: TemplateSectionDef[];
  approvalBeforeSend: boolean;
  sendAutomatically: boolean;
}

export async function saveTemplate(templateId: string, save: TemplateSave): Promise<TemplateData> {
  return post<TemplateData>(
    `/report-fte/templates/${encodeURIComponent(templateId)}`,
    {
      sections: save.sections.map((s) => ({
        id: s.id,
        title: s.title,
        tools: s.tools,
        settings: s.settings,
        viz: s.viz,
        on: s.on,
        narrative: s.narrative,
        explainLinks: s.explainLinks,
      })),
      approvalBeforeSend: save.approvalBeforeSend,
      sendAutomatically: save.sendAutomatically,
    },
    "Saving the template failed",
    "PUT",
  );
}

export async function renameRun(runId: number, title: string): Promise<{ runId: number; title: string }> {
  return post(`/report-fte/runs/${runId}`, { title }, "Renaming the report failed", "PATCH");
}

/** Idempotent — 404 means it is already gone. */
export async function deleteRun(runId: number): Promise<void> {
  const response = await fetch(proxyUrl(`/report-fte/runs/${runId}`), { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw await fail(response, "Deleting the report failed");
}

export async function duplicateRun(runId: number): Promise<ComposerData> {
  return post<ComposerData>(`/report-fte/runs/${runId}/duplicate`, undefined, "Copying the report failed");
}

/** Edit the plan by talking to it (SPEC-284); the run comes back as a draft when something changed. */
export async function reviseRun(runId: number, message: string): Promise<ReviseResult> {
  return post<ReviseResult>(`/report-fte/runs/${runId}/revise`, { message }, "Asking for the change failed");
}

/** The run's files — plain links, so the browser downloads them with the session cookie. */
export function runPdfHref(runId: number): string {
  return proxyUrl(`/report-fte/runs/${runId}/pdf`);
}

export function runExcelHref(runId: number): string {
  return proxyUrl(`/report-fte/runs/${runId}/excel`);
}

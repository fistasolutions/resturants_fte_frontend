"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import * as actions from "@/services/report-fte-actions";
import type { ComposerData, ExecuteEvent, ScheduleAuthority } from "@/types/report-fte";

/**
 * Every write the Report FTE views make (SPEC-285), behind one hook. Each action posts
 * through the proxy to backend SPEC-283 and invalidates the `["report-fte"]` prefix so
 * the Desk, the Delivered tab and the templates reflect it on their next read.
 */
export function useReportFteActions() {
  const queryClient = useQueryClient();
  const invalidate = useCallback(
    () => void queryClient.invalidateQueries({ queryKey: ["report-fte"] }),
    [queryClient],
  );

  const createRun = useCallback(
    async (input: { ask?: string; templateId?: string }): Promise<ComposerData> => {
      const run = await actions.createRun(input);
      queryClient.setQueryData(["report-fte", "run", run.runId], run);
      return run;
    },
    [queryClient],
  );

  const executeRun = useCallback(
    async (runId: number, onEvent: (event: ExecuteEvent) => void): Promise<ComposerData> => {
      const done = await actions.executeRun(runId, onEvent);
      queryClient.setQueryData(["report-fte", "run", runId], done);
      invalidate();
      return done;
    },
    [invalidate, queryClient],
  );

  const approveSend = useCallback(
    async (runId: number, to?: string[]) => {
      const result = await actions.sendRun(runId, to);
      invalidate();
      return result;
    },
    [invalidate],
  );

  const approveSchedule = useCallback(
    async (runId: number, body?: Record<string, unknown>) => {
      const result = await actions.scheduleRun(runId, body);
      invalidate();
      return result;
    },
    [invalidate],
  );

  const setScheduleAuthority = useCallback(
    async (id: string, authority: ScheduleAuthority) => {
      await actions.setScheduleAuthority(id, authority);
      invalidate();
    },
    [invalidate],
  );

  const pauseAll = useCallback(async () => {
    const result = await actions.pauseAllSchedules();
    invalidate();
    return result;
  }, [invalidate]);

  const saveTemplate = useCallback(
    async (templateId: string, save: actions.TemplateSave) => {
      const result = await actions.saveTemplate(templateId, save);
      invalidate();
      return result;
    },
    [invalidate],
  );

  const recordOutcome = useCallback(
    async (runId: number, actedOn: string) => {
      const result = await actions.recordOutcome(runId, actedOn);
      invalidate();
      return result;
    },
    [invalidate],
  );

  const renameRun = useCallback(
    async (runId: number, title: string) => {
      const result = await actions.renameRun(runId, title);
      invalidate();
      return result;
    },
    [invalidate],
  );

  const deleteRun = useCallback(
    async (runId: number) => {
      await actions.deleteRun(runId);
      queryClient.removeQueries({ queryKey: ["report-fte", "run", runId] });
      invalidate();
    },
    [invalidate, queryClient],
  );

  const duplicateRun = useCallback(
    async (runId: number): Promise<ComposerData> => {
      const run = await actions.duplicateRun(runId);
      queryClient.setQueryData(["report-fte", "run", run.runId], run);
      invalidate();
      return run;
    },
    [invalidate, queryClient],
  );

  const reviseRun = useCallback(
    async (runId: number, message: string) => {
      const result = await actions.reviseRun(runId, message);
      queryClient.setQueryData(["report-fte", "run", runId], result.run);
      invalidate();
      return result;
    },
    [invalidate, queryClient],
  );

  return {
    createRun,
    executeRun,
    approveSend,
    approveSchedule,
    setScheduleAuthority,
    pauseAll,
    saveTemplate,
    recordOutcome,
    renameRun,
    deleteRun,
    duplicateRun,
    reviseRun,
  };
}

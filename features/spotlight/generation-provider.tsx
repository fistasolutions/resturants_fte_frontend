"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { shouldKeepPolling, type GenerationJob } from "@/lib/generation";
import { getActiveGeneration } from "@/services/spotlight-generation";

/**
 * Knows whether a blog is being generated, anywhere in the app (SPEC-216).
 *
 * Mounted in the app shell so the toast appears on every page and — crucially —
 * **survives a hard refresh**, because the truth lives in a database row rather than in
 * a component's state. That is the whole point of backend SPEC-224: the run used to die
 * with the page that started it.
 *
 * Polling rather than SSE, deliberately: progress is a row, so a poll resumes trivially
 * after a refresh where a stream would have to be re-established, and the payload is a
 * dozen fields every few seconds.
 */
interface GenerationContextValue {
  job: GenerationJob | null;
  /** Call after starting one so the toast appears immediately, without waiting a tick. */
  setJob: (job: GenerationJob | null) => void;
  refresh: () => Promise<void>;
  dismissed: boolean;
  dismiss: () => void;
}

const GenerationContext = createContext<GenerationContextValue>({
  job: null,
  setJob: () => {},
  refresh: async () => {},
  dismissed: false,
  dismiss: () => {},
});

export const useGeneration = () => useContext(GenerationContext);

//: While running, often enough to feel live; a finished job stops polling entirely.
const POLL_MS = 3000;

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await getActiveGeneration(signal);
      setJob((current) => {
        // A run that just finished: the active endpoint returns null, so keep the last
        // known job visible long enough to offer the finished draft rather than having
        // the toast blink out at the moment it becomes useful.
        if (!next && current?.status === "running") {
          return { ...current, status: "succeeded" };
        }
        return next;
      });
      if (next) setDismissed(false);
    } catch {
      // A failed poll is not worth surfacing — the next one is three seconds away. An
      // ABORTED poll is not even a failure: the interval was cleared or the page
      // navigated, and the answer stopped mattering.
    }
  }, []);

  // One effect, two jobs: the deferred first poll (which is what restores the toast
  // after a hard refresh) and the repeat poll while something is running.
  //
  // The first call goes through a 0ms timeout rather than being invoked in the effect
  // body. `refresh` is async so its setState already lands after an await, but starting
  // it synchronously trips the cascading-render rule — and deferring is both cheaper to
  // read and what the rule is actually asking for.
  const isRunning = shouldKeepPolling(job);
  useEffect(() => {
    // One controller for the effect's lifetime: on cleanup every in-flight poll is
    // aborted, so a navigation cannot leave a request completing against a reader that
    // has gone (which is what logged `ECONNRESET` in the server output).
    const controller = new AbortController();
    const tick = () => {
      if (!controller.signal.aborted) void refresh(controller.signal);
    };
    const first = window.setTimeout(tick, 0);
    // Only repeat while there is something to watch — an idle app makes no traffic.
    const repeat = isRunning ? window.setInterval(tick, POLL_MS) : undefined;
    return () => {
      controller.abort();
      window.clearTimeout(first);
      if (repeat !== undefined) window.clearInterval(repeat);
    };
    // `isRunning`, not `job`: a body_chars tick must not tear down and rebuild the
    // interval every three seconds — only starting or stopping should.
  }, [isRunning, refresh]);

  return (
    <GenerationContext.Provider
      value={{
        job,
        setJob: (next) => {
          setJob(next);
          setDismissed(false);
        },
        refresh,
        dismissed,
        dismiss: () => setDismissed(true),
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

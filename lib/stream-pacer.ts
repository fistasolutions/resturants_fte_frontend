/**
 * Paced streaming (SPEC-355): a reply arrives from the model in bursts — a whole paragraph
 * in one chunk, then nothing — so drawing each chunk as it lands makes an answer jump onto
 * the screen. The pacer draws the received text at a steady reading pace instead, speeding
 * up only so it never falls far behind, and lets the caller commit the reply once all of it
 * has been shown. One pacer for every chat (Glisp and each digital employee).
 */

/** The slowest the text is drawn, in characters a second. */
export const BASE_CPS = 90;
/** While streaming, the backlog is drawn within this many seconds. */
export const CATCH_UP_S = 1.2;
/** Once the network has finished, the rest is drawn within this many seconds. */
export const FINISH_S = 0.5;
/** A long frame (a background tab) never jumps more than this much time. */
export const MAX_FRAME_MS = 100;

/**
 * How many characters of `target` to show after `dtMs`, given `shown` were on screen.
 * Pure. Never overshoots, always advances while there is a backlog, and never ends between
 * the two halves of a surrogate pair (an emoji drawn as half a character).
 */
export function revealStep(shown: number, target: string, dtMs: number, finishing: boolean): number {
  const total = target.length;
  if (shown >= total) return total;
  const backlog = total - shown;
  const seconds = Math.min(Math.max(dtMs, 0), MAX_FRAME_MS) / 1000;
  const cps = Math.max(BASE_CPS, backlog / (finishing ? FINISH_S : CATCH_UP_S));
  let next = Math.min(total, shown + Math.max(1, Math.round(cps * seconds)));
  const last = target.charCodeAt(next - 1);
  if (next < total && last >= 0xd800 && last <= 0xdbff) next += 1;
  return next;
}

export interface StreamPacer {
  /** The full text received so far (each delta's accumulated reply). */
  push: (full: string) => void;
  /** The network is done: resolves once every received character is on screen. */
  finish: () => Promise<void>;
  /** Stop drawing (an error, an unmount); a pending `finish` resolves. */
  cancel: () => void;
}

export interface PacerScheduler {
  request: (callback: (time: number) => void) => number;
  cancel: (handle: number) => void;
  now: () => number;
  /** A hidden tab draws nothing, so the pacer flushes instead of waiting. */
  hidden: () => boolean;
}

const browserScheduler: PacerScheduler = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (handle) => window.cancelAnimationFrame(handle),
  now: () => performance.now(),
  hidden: () => typeof document !== "undefined" && document.hidden,
};

export function createStreamPacer(
  onFrame: (text: string) => void,
  scheduler: PacerScheduler = browserScheduler,
): StreamPacer {
  let target = "";
  let shown = 0;
  let finishing = false;
  let handle: number | null = null;
  let last = 0;
  let settle: (() => void) | null = null;

  const done = () => {
    handle = null;
    if (finishing && settle) {
      settle();
      settle = null;
    }
  };

  const tick = (time: number) => {
    const next = revealStep(shown, target, time - last, finishing);
    last = time;
    if (next !== shown) {
      shown = next;
      onFrame(target.slice(0, shown));
    }
    if (shown < target.length) handle = scheduler.request(tick);
    else done();
  };

  const schedule = () => {
    if (handle !== null) return;
    last = scheduler.now();
    handle = scheduler.request(tick);
  };

  const flush = () => {
    if (handle !== null) scheduler.cancel(handle);
    if (shown !== target.length) {
      shown = target.length;
      onFrame(target);
    }
    done();
  };

  return {
    push(full) {
      target = full;
      if (shown > target.length) shown = target.length;
      if (scheduler.hidden()) flush();
      else schedule();
    },
    finish() {
      finishing = true;
      if (shown >= target.length || scheduler.hidden()) {
        flush();
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        settle = resolve;
        schedule();
      });
    },
    cancel() {
      if (handle !== null) scheduler.cancel(handle);
      handle = null;
      if (settle) {
        settle();
        settle = null;
      }
    },
  };
}

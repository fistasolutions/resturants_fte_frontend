/**
 * Talk to Glisp (SPEC-268 → SPEC-273): the pure half of the line — PCM
 * conversion for the wire (PCM16 mono 24 kHz both ways), a level reading, the
 * uplink queue that keeps one audio POST in flight, and the state pill's words.
 * The server decides when a sentence has ended; nothing here detects turns.
 */

export const VOICE_SAMPLE_RATE = 24_000;

/** Float32 samples (−1..1) → PCM16 for the request body. */
export function floatToPcm16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
  }
  return out;
}

/** PCM16 → Float32 for an AudioBuffer. */
export function pcm16ToFloat(samples: Int16Array): Float32Array {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] / (samples[i] < 0 ? 32768 : 32767);
  return out;
}

/** A base64 `audio` frame → PCM16 (little-endian, as the backend writes it). */
export function base64ToPcm16(encoded: string): Int16Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const even = bytes.length - (bytes.length % 2);
  return new Int16Array(bytes.buffer, 0, even / 2);
}

/** Root-mean-square level of a chunk, 0..1. */
export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/** Concatenate captured chunks into one buffer. */
export function joinPcm(chunks: Int16Array[]): Int16Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Int16Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

/** How much captured audio the uplink may hold back while a POST is away —
 * beyond this the oldest is dropped rather than the queue growing without bound. */
export const UPLINK_CAP_SAMPLES = VOICE_SAMPLE_RATE * 4;
/** One POST carries at most this much (the backend refuses over 2 s). */
export const UPLINK_MAX_SAMPLES = Math.floor(VOICE_SAMPLE_RATE * 1.5);

/**
 * The uplink (SPEC-273): one audio POST in flight at a time; chunks captured
 * while it is away are joined into the next POST, so a slow link means bigger
 * chunks, never a backlog. Pure — `send` is injected and awaited.
 */
export class LiveUplink {
  private queued: Int16Array[] = [];
  private queuedSamples = 0;
  private inFlight = false;
  private stopped = false;
  dropped = 0;

  constructor(
    private readonly send: (pcm: Int16Array) => Promise<void>,
    private readonly cap = UPLINK_CAP_SAMPLES,
    private readonly max = UPLINK_MAX_SAMPLES,
  ) {}

  get pending(): number {
    return this.queuedSamples;
  }

  get busy(): boolean {
    return this.inFlight;
  }

  /** Queue a captured chunk and start a POST if none is away. */
  push(pcm: Int16Array): void {
    if (this.stopped || pcm.length === 0) return;
    this.queued.push(pcm);
    this.queuedSamples += pcm.length;
    while (this.queuedSamples > this.cap && this.queued.length > 1) {
      const oldest = this.queued.shift();
      if (oldest) {
        this.queuedSamples -= oldest.length;
        this.dropped += oldest.length;
      }
    }
    if (!this.inFlight) void this.drain();
  }

  /** Nothing queued leaves after this. */
  stop(): void {
    this.stopped = true;
    this.queued = [];
    this.queuedSamples = 0;
  }

  private async drain(): Promise<void> {
    this.inFlight = true;
    try {
      while (this.queued.length > 0 && !this.stopped) {
        const joined = joinPcm(this.queued);
        this.queued = [];
        this.queuedSamples = 0;
        // in order, never more than one POST's worth at a time
        for (let at = 0; at < joined.length && !this.stopped; at += this.max) {
          try {
            await this.send(joined.subarray(at, Math.min(at + this.max, joined.length)));
          } catch {
            // the line's own stream reports a dead call; a lost chunk is not worth a retry
          }
        }
      }
    } finally {
      this.inFlight = false;
    }
  }
}

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

/** The state pill's wording. */
export function voiceStateLabel(state: VoiceState, status: string | null, muted: boolean): string {
  if (muted) return "Muted";
  switch (state) {
    case "connecting":
      return "Connecting…";
    case "listening":
      return "Listening";
    case "thinking":
      return status ?? "Thinking…";
    case "speaking":
      return "Speaking";
    default:
      return "Tap to talk";
  }
}

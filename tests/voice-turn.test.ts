import { describe, expect, it } from "vitest";

import {
  LiveUplink,
  base64ToPcm16,
  floatToPcm16,
  joinPcm,
  pcm16ToFloat,
  rms,
  voiceStateLabel,
} from "@/lib/voice-turn";

describe("pcm helpers", () => {
  it("converts float samples to PCM16 and back within rounding", () => {
    const pcm = floatToPcm16(new Float32Array([0, 0.5, -0.5, 1, -1, 2, -2]));
    expect(Array.from(pcm)).toEqual([0, 16384, -16384, 32767, -32768, 32767, -32768]);
    const back = pcm16ToFloat(pcm);
    expect(back[1]).toBeCloseTo(0.5, 3);
    expect(back[4]).toBe(-1);
  });
  it("decodes a base64 frame as little-endian PCM16 and joins chunks", () => {
    const bytes = new Uint8Array([100, 0, 156, 255]); // 100, -100
    const encoded = Buffer.from(bytes).toString("base64");
    expect(Array.from(base64ToPcm16(encoded))).toEqual([100, -100]);
    expect(Array.from(joinPcm([new Int16Array([1, 2]), new Int16Array([3])]))).toEqual([1, 2, 3]);
  });
  it("reads a level", () => {
    expect(rms(new Float32Array([]))).toBe(0);
    expect(rms(new Float32Array([0.5, -0.5]))).toBeCloseTo(0.5);
  });
});

describe("LiveUplink", () => {
  function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => { resolve = r; });
    return { promise, resolve };
  }
  it("keeps one POST in flight and joins what queued behind it", async () => {
    const sent: Int16Array[] = [];
    const gates: ReturnType<typeof deferred>[] = [];
    const uplink = new LiveUplink(async (pcm) => {
      sent.push(pcm);
      const gate = deferred();
      gates.push(gate);
      await gate.promise;
    });
    uplink.push(new Int16Array([1, 1]));
    expect(uplink.busy).toBe(true);
    uplink.push(new Int16Array([2, 2]));
    uplink.push(new Int16Array([3]));
    expect(uplink.pending).toBe(3);
    expect(sent).toHaveLength(1);
    gates[0].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sent).toHaveLength(2);
    expect(Array.from(sent[1])).toEqual([2, 2, 3]);
    expect(uplink.pending).toBe(0);
    gates[1].resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(uplink.busy).toBe(false);
  });
  it("drops the oldest past the cap, ignores empties, and nothing after stop", async () => {
    const sent: Int16Array[] = [];
    const release = deferred();
    const uplink = new LiveUplink(async (pcm) => {
      sent.push(pcm);
      await release.promise;
    }, 4);
    uplink.push(new Int16Array([9]));
    uplink.push(new Int16Array([1, 1]));
    uplink.push(new Int16Array([2, 2]));
    uplink.push(new Int16Array([3, 3]));
    expect(uplink.pending).toBe(4);
    expect(uplink.dropped).toBe(2);
    uplink.push(new Int16Array(0));
    expect(uplink.pending).toBe(4);
    uplink.stop();
    expect(uplink.pending).toBe(0);
    release.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sent).toHaveLength(1);
    uplink.push(new Int16Array([5]));
    expect(uplink.pending).toBe(0);
  });
  it("splits a big coalesced chunk into POST-sized pieces, in order", async () => {
    const sent: number[][] = [];
    const uplink = new LiveUplink(
      async (pcm) => {
        sent.push(Array.from(pcm));
      },
      100,
      3,
    );
    uplink.push(new Int16Array([1, 2, 3, 4, 5, 6, 7]));
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(sent).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });
  it("a failed POST does not stop the next one", async () => {
    let calls = 0;
    const uplink = new LiveUplink(async () => {
      calls += 1;
      if (calls === 1) throw new Error("gone");
    });
    uplink.push(new Int16Array([1]));
    await Promise.resolve();
    await Promise.resolve();
    uplink.push(new Int16Array([2]));
    await Promise.resolve();
    await Promise.resolve();
    expect(calls).toBe(2);
  });
});

describe("voiceStateLabel", () => {
  it("wordings", () => {
    expect(voiceStateLabel("idle", null, false)).toBe("Tap to talk");
    expect(voiceStateLabel("connecting", null, false)).toBe("Connecting…");
    expect(voiceStateLabel("listening", null, false)).toBe("Listening");
    expect(voiceStateLabel("thinking", "Reading revenue…", false)).toBe("Reading revenue…");
    expect(voiceStateLabel("thinking", null, false)).toBe("Thinking…");
    expect(voiceStateLabel("speaking", null, true)).toBe("Muted");
  });
});

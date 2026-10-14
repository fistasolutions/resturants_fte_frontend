"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatSession } from "@/features/chat/use-chat-session";
import {
  endLiveCall,
  interruptLiveCall,
  openLiveCall,
  sendLiveAudio,
  VoiceTurnError,
} from "@/services/chat";
import {
  LiveUplink,
  VOICE_SAMPLE_RATE,
  floatToPcm16,
  pcm16ToFloat,
  rms,
  type VoiceState,
} from "@/lib/voice-turn";
import type { ChatPageContext } from "@/types/chat";

/** The microphone worklet: hands 2048-sample Float32 chunks (~85 ms) to the page. */
const CAPTURE_WORKLET = `
class GlispCapture extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(2048); this.at = 0; }
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.at++] = input[i];
      if (this.at === this.buffer.length) { this.port.postMessage(this.buffer); this.buffer = new Float32Array(2048); this.at = 0; }
    }
    return true;
  }
}
registerProcessor("glisp-capture", GlispCapture);
`;

/** Sustained voice over Glisp's speech that counts as "let me cut in". */
const BARGE_IN_LEVEL = 0.05;
const BARGE_IN_MS = 350;
/** Captured audio is sent in batches of about this many samples (~120 ms). */
const UPLINK_BATCH = 2_880;

export interface VoiceSession {
  state: VoiceState;
  muted: boolean;
  /** The live level for the sphere — microphone or playback, whichever is live. */
  levelRef: React.RefObject<number>;
  /** The owner's words, as the model hears them. */
  transcript: string | null;
  replyText: string | null;
  status: string | null;
  error: string | null;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  toggleMute: () => void;
}

/**
 * Talk to Glisp as a phone line (SPEC-273): the microphone streams up as it is
 * captured, the server hears, decides when a sentence has ended, and speaks
 * back while it thinks; the reply plays the moment it arrives and the owner can
 * talk over it. Every stored exchange lands in the session's thread as cards.
 */
export function useVoiceSession(session: ChatSession, context: ChatPageContext | null): VoiceSession {
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const levelRef = useRef(0);

  const audio = useRef<{
    context: AudioContext;
    stream: MediaStream;
    source: MediaStreamAudioSourceNode;
    node: AudioWorkletNode | ScriptProcessorNode;
    analyser: AnalyserNode;
  } | null>(null);
  const stateRef = useRef<VoiceState>("idle");
  const statusRef = useRef<string | null>(null);
  const mutedRef = useRef(false);
  const callId = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const uplink = useRef<LiveUplink | null>(null);
  const batch = useRef<Int16Array[]>([]);
  const batched = useRef(0);
  const playhead = useRef(0);
  const playing = useRef<AudioBufferSourceNode[]>([]);
  const bargeSince = useRef<number | null>(null);
  const starting = useRef<Promise<void> | null>(null);
  // the line said "listening" before the microphone was ours
  const lineReady = useRef(false);
  const pendingStop = useRef<number | null>(null);
  const sessionRef = useRef(session);
  const contextRef = useRef(context);
  useEffect(() => {
    sessionRef.current = session;
    contextRef.current = context;
  }, [session, context]);

  const supported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.AudioContext !== "undefined";

  function go(next: VoiceState) {
    stateRef.current = next;
    setState(next);
  }

  function stopPlayback() {
    for (const source of playing.current) {
      try {
        source.stop();
      } catch {
        // already ended
      }
    }
    playing.current = [];
    playhead.current = 0;
  }

  function schedule(pcm: Int16Array) {
    const a = audio.current;
    if (!a || pcm.length === 0) return;
    const buffer = a.context.createBuffer(1, pcm.length, VOICE_SAMPLE_RATE);
    buffer.getChannelData(0).set(pcm16ToFloat(pcm));
    const source = a.context.createBufferSource();
    source.buffer = buffer;
    source.connect(a.analyser);
    const at = Math.max(a.context.currentTime + 0.02, playhead.current);
    source.start(at);
    playhead.current = at + buffer.duration;
    playing.current.push(source);
    source.onended = () => {
      playing.current = playing.current.filter((s) => s !== source);
      if (playing.current.length === 0 && stateRef.current === "speaking") {
        // the reply is fully spoken — back to listening, unless a tool is still
        // reading the store for the rest of it ("Let me look." · tool · answer)
        go(statusRef.current ? "thinking" : "listening");
      }
    };
  }

  function flushBatch() {
    if (batched.current === 0 || !uplink.current) return;
    const chunks = batch.current;
    batch.current = [];
    batched.current = 0;
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const joined = new Int16Array(total);
    let at = 0;
    for (const chunk of chunks) {
      joined.set(chunk, at);
      at += chunk.length;
    }
    uplink.current.push(joined);
  }

  function onChunk(samples: Float32Array) {
    const now = performance.now();
    const level = rms(samples);
    const current = stateRef.current;
    if (current === "idle" || current === "connecting" || mutedRef.current) return;
    // the line hears everything, always — the server decides where a sentence ends
    batch.current.push(floatToPcm16(samples));
    batched.current += samples.length;
    if (batched.current >= UPLINK_BATCH) flushBatch();
    if (current === "speaking") {
      // the sphere follows the reply; a sustained voice over it is a barge-in
      if (level >= BARGE_IN_LEVEL) {
        bargeSince.current ??= now;
        if (now - bargeSince.current >= BARGE_IN_MS) {
          bargeSince.current = null;
          stopPlayback();
          statusRef.current = null;
          setStatus(null);
          go("listening");
          const id = callId.current;
          if (id) void interruptLiveCall(id);
        }
      } else {
        bargeSince.current = null;
      }
      return;
    }
    levelRef.current = Math.min(1, level * 5);
  }

  async function openLine(): Promise<void> {
    const controller = new AbortController();
    abort.current = controller;
    const line = sessionRef.current.lineFor();
    let firstAudio = true;
    try {
      const ended = await openLiveCall(
        {
          onCall: (call) => {
            callId.current = call.id;
            uplink.current = new LiveUplink((pcm) => sendLiveAudio(call.id, pcm));
          },
          onListening: () => {
            lineReady.current = true;
            if (stateRef.current === "connecting" && audio.current) go("listening");
          },
          onYou: (text) => setTranscript(text),
          onStatus: (s) => {
            statusRef.current = s;
            setStatus(s);
            if (stateRef.current === "listening") go("thinking");
          },
          onDelta: (text) => {
            setReplyText(text);
          },
          onAudio: (chunk) => {
            if (controller.signal.aborted) return;
            if (firstAudio || stateRef.current !== "speaking") {
              firstAudio = false;
              go("speaking");
            }
            schedule(chunk);
          },
          onInterrupted: () => {
            stopPlayback();
            if (stateRef.current === "speaking") go("listening");
          },
          onTurn: (turn) => {
            sessionRef.current.liveTurn(line.id, turn);
            setTranscript(null);
            setReplyText(turn.content || null);
            statusRef.current = null;
            setStatus(null);
            firstAudio = true;
            if (stateRef.current === "thinking") go("listening");
          },
          onError: (_code, detail) => setError(detail),
        },
        {
          conversationId: line.id,
          projectId: line.projectId,
          context: contextRef.current,
          signal: controller.signal,
        },
      );
      if (!controller.signal.aborted && ended !== "hung_up") {
        setError((current) => current ?? (ended === "session_limit" ? "The line reached its limit — start again." : null));
      }
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(
        failure instanceof VoiceTurnError
          ? failure.message
          : failure instanceof Error
            ? failure.message
            : "Glisp could not stay on the line just now.",
      );
    } finally {
      if (abort.current === controller) {
        abort.current = null;
        uplink.current?.stop();
        uplink.current = null;
        callId.current = null;
        if (stateRef.current !== "idle") go("idle");
      }
    }
  }

  async function start() {
    if (audio.current || !supported) return;
    // One capture at a time: a second call while the first is still asking for
    // the microphone would open a second stream (and a second permission prompt).
    if (starting.current) return starting.current;
    starting.current = open();
    try {
      await starting.current;
    } finally {
      starting.current = null;
    }
  }

  async function open() {
    setError(null);
    setTranscript(null);
    setReplyText(null);
    statusRef.current = null;
    setStatus(null);
    lineReady.current = false;
    go("connecting");
    // The line and the microphone open together (SPEC-272 Patches): the server is
    // connecting to the voice model while the browser is still asking for the
    // microphone, instead of one after the other.
    void openLine();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      const context = new AudioContext({ sampleRate: VOICE_SAMPLE_RATE });
      const source = context.createMediaStreamSource(stream);
      let node: AudioWorkletNode | ScriptProcessorNode;
      if (context.audioWorklet) {
        const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: "application/javascript" }));
        await context.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        const worklet = new AudioWorkletNode(context, "glisp-capture");
        worklet.port.onmessage = (event: MessageEvent<Float32Array>) => onChunk(event.data);
        node = worklet;
      } else {
        const processor = context.createScriptProcessor(2048, 1, 1);
        processor.onaudioprocess = (event) => onChunk(event.inputBuffer.getChannelData(0).slice());
        node = processor;
      }
      source.connect(node);
      // the capture node needs a sink to run; a silent gain keeps the mic out of the speakers
      const sink = context.createGain();
      sink.gain.value = 0;
      node.connect(sink);
      sink.connect(context.destination);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.connect(context.destination);
      audio.current = { context, stream, source, node, analyser };
      // the microphone is ours — if the line is already open, we are listening
      if (abort.current) go(lineReady.current ? "listening" : "connecting");
    } catch (failure) {
      // no microphone — hang up the line that was opening alongside it
      stop();
      setError(
        failure instanceof DOMException && failure.name === "NotAllowedError"
          ? "The microphone is blocked — allow it in the browser's site settings."
          : "The microphone could not be started.",
      );
    }
  }

  const stop = useCallback(() => {
    const id = callId.current;
    abort.current?.abort();
    abort.current = null;
    uplink.current?.stop();
    uplink.current = null;
    callId.current = null;
    batch.current = [];
    batched.current = 0;
    if (id) void endLiveCall(id);
    stopPlayback();
    const a = audio.current;
    if (a) {
      a.node.disconnect();
      a.source.disconnect();
      a.stream.getTracks().forEach((track) => track.stop());
      void a.context.close();
      audio.current = null;
    }
    levelRef.current = 0;
    go("idle");
  }, []);

  // the playback level for the sphere while Glisp speaks
  useEffect(() => {
    if (state !== "speaking") return;
    let frame = 0;
    const data = new Float32Array(512);
    const tick = () => {
      const a = audio.current;
      if (a) {
        a.analyser.getFloatTimeDomainData(data);
        levelRef.current = Math.min(1, rms(data) * 1.6);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  // Released on a real unmount only: React's development double-invoke unmounts
  // and remounts at once, and the line is already opening — a deferred stop that
  // the remount cancels keeps it to one line and one microphone.
  useEffect(() => {
    if (pendingStop.current !== null) {
      window.clearTimeout(pendingStop.current);
      pendingStop.current = null;
    }
    return () => {
      pendingStop.current = window.setTimeout(() => {
        pendingStop.current = null;
        stop();
      }, 60);
    };
  }, [stop]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      mutedRef.current = !current;
      const a = audio.current;
      a?.stream.getAudioTracks().forEach((track) => {
        track.enabled = current;
      });
      return !current;
    });
  }, []);

  return { state, muted, levelRef, transcript, replyText, status, error, supported, start, stop, toggleMute };
}

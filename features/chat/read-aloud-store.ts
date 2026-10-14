"use client";

import { VOICE_SAMPLE_RATE, pcm16ToFloat } from "@/lib/voice-turn";
import { streamSpeech } from "@/services/chat";

/**
 * The one speaker (SPEC-254): every Read aloud — a card's own button, or the
 * Voice replies toggle reading a fresh answer — goes through here, so two cards
 * never talk over each other and every card knows whether it is the one speaking.
 *
 * Since SPEC-273 the voice is Glisp's own: the text is read by the voice card's
 * speech model (`POST /chat/speech`, streamed PCM) and played through one
 * `AudioContext`, chunk by chunk as it arrives — never the phone's
 * `speechSynthesis`, which iOS silences with the ring switch, Safari drops on
 * "stop then speak", and Android voices at random. The context is created and
 * resumed inside the click so a phone allows the playback that follows.
 */

interface Reading {
  id: string;
  controller: AbortController;
  sources: AudioBufferSourceNode[];
  playhead: number;
  streamDone: boolean;
}

let speakingId: string | null = null;
let current: Reading | null = null;
let context: AudioContext | null = null;
const listeners = new Set<() => void>();

function emit(next: string | null): void {
  speakingId = next;
  listeners.forEach((listener) => listener());
}

export function subscribeReadAloud(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSpeakingId(): string | null {
  return speakingId;
}

export function readAloudSupported(): boolean {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined";
}

function speaker(): AudioContext | null {
  if (!readAloudSupported()) return null;
  context ??= new AudioContext({ sampleRate: VOICE_SAMPLE_RATE });
  // Resuming inside the gesture is what unlocks a phone's audio for the fetch
  // that follows; a context already running resolves at once.
  if (context.state !== "running") void context.resume();
  return context;
}

function finish(reading: Reading): void {
  if (current === reading) {
    current = null;
    emit(null);
  }
}

function schedule(audio: AudioContext, reading: Reading, pcm: Int16Array): void {
  const buffer = audio.createBuffer(1, pcm.length, VOICE_SAMPLE_RATE);
  buffer.getChannelData(0).set(pcm16ToFloat(pcm));
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.connect(audio.destination);
  const at = Math.max(audio.currentTime + 0.02, reading.playhead);
  source.start(at);
  reading.playhead = at + buffer.duration;
  reading.sources.push(source);
  source.onended = () => {
    reading.sources = reading.sources.filter((s) => s !== source);
    if (reading.sources.length === 0 && reading.streamDone) finish(reading);
  };
}

export function stopReadAloud(): void {
  const active = current;
  current = null;
  if (active) {
    active.controller.abort();
    for (const source of active.sources) {
      try {
        source.stop();
      } catch {
        // already ended
      }
    }
    active.sources = [];
  }
  if (speakingId !== null) emit(null);
}

/** Speak `text` as message `id` in Glisp's voice; whatever was speaking stops first. */
export function speakReadAloud(id: string, text: string): void {
  if (!readAloudSupported() || !text.trim()) return;
  stopReadAloud();
  const audio = speaker();
  if (!audio) return;
  const reading: Reading = {
    id,
    controller: new AbortController(),
    sources: [],
    playhead: 0,
    streamDone: false,
  };
  current = reading;
  emit(id);
  void streamSpeech(
    text,
    (pcm) => {
      if (current === reading && pcm.length > 0) schedule(audio, reading, pcm);
    },
    reading.controller.signal,
  )
    .then(() => {
      reading.streamDone = true;
      if (reading.sources.length === 0) finish(reading);
    })
    .catch(() => {
      // stopped by a newer read, or the voice is unavailable — the card's
      // speaker returns to rest; the panel's own status names the reason
      finish(reading);
    });
}

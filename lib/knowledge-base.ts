/**
 * Knowledge Base — pure, unit-testable logic (SPEC-267): the file-type catalogue with
 * its coming-soon set, the refusal a dropped file gets before any request, tag
 * parsing, and the library's client-side search / filter / sort (the list is an
 * owner's documents, not orders — bounded, so it never pages).
 */

import type { BrandSource, SourceKind } from "@/types/brand-brain";

export interface KindMeta {
  key: string;
  label: string;
  /** Lower-case extensions, with the dot. */
  extensions: readonly string[];
  comingSoon: boolean;
}

/** The upload tiles, in display order. The last three are promised, not built. */
export const KIND_META: readonly KindMeta[] = [
  { key: "pdf", label: "PDF", extensions: [".pdf"], comingSoon: false },
  { key: "doc", label: "Doc", extensions: [".docx"], comingSoon: false },
  { key: "sheet", label: "Sheet", extensions: [".xlsx", ".xlsm"], comingSoon: false },
  { key: "slides", label: "Slides", extensions: [".pptx"], comingSoon: false },
  { key: "csv", label: "CSV", extensions: [".csv"], comingSoon: false },
  { key: "text", label: "Text", extensions: [".txt", ".md", ".markdown"], comingSoon: false },
  { key: "image", label: "Image", extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic"], comingSoon: true },
  { key: "audio", label: "Audio", extensions: [".mp3", ".m4a", ".wav", ".aac"], comingSoon: true },
  { key: "video", label: "Video", extensions: [".mp4", ".mov", ".webm", ".mkv"], comingSoon: true },
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** The `accept` attribute for the file input — live kinds only. */
export const ACCEPT_LIVE = KIND_META.filter((k) => !k.comingSoon)
  .flatMap((k) => k.extensions)
  .join(",");

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/** Why a file cannot be added — decided in the browser, before any request. Null = fine. */
export function refuseReason(file: { name: string; size: number }): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return "That file is over 10 MB.";
  const ext = extensionOf(file.name);
  const meta = KIND_META.find((k) => k.extensions.includes(ext));
  if (!meta) return "Only PDF, Doc, Sheet, Slides, CSV and text files can be read.";
  if (meta.comingSoon) {
    const what = meta.label === "Image" ? "Images are" : `${meta.label} is`;
    return `${what} coming soon — for now, paste the text instead.`;
  }
  return null;
}

/** "Company, product" → ["Company", "product"]; trimmed, de-duplicated, at most 10. */
export function parseTags(raw: string, existing: string[] = []): string[] {
  const out = [...existing];
  const seen = new Set(existing.map((t) => t.toLowerCase()));
  for (const piece of raw.split(",")) {
    const tag = piece.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
    if (out.length >= 10) break;
  }
  return out;
}

/** Every tag in the library, most used first, ties alphabetical. */
export function allTags(sources: Pick<BrandSource, "tags">[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of sources) for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export type LibrarySort = "newest" | "review" | "name" | "taught";

/** The one status a card shows (SPEC-274): what needs the owner comes first. */
export type LibraryStatus = "review" | "reading" | "ready" | "failed" | "watched";

export function libraryStatus(s: Pick<BrandSource, "status" | "pendingCount" | "kind">): LibraryStatus {
  if (s.status === "extracting") return "reading";
  if (s.status === "failed") return "failed";
  if (s.pendingCount > 0) return "review";
  return s.kind === "url" ? "watched" : "ready";
}

export const LIBRARY_STATUS_LABEL: Record<LibraryStatus, string> = {
  review: "Needs review",
  reading: "Reading",
  ready: "Ready",
  failed: "Failed",
  watched: "Watched",
};

export type LibraryStatusFilter = "all" | "review" | "reading" | "ready" | "failed";

export const LIBRARY_STATUS_FILTERS: { key: LibraryStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "review", label: "Needs review" },
  { key: "reading", label: "Reading" },
  { key: "ready", label: "Ready" },
  { key: "failed", label: "Failed" },
];

export function matchesStatus(s: BrandSource, filter: LibraryStatusFilter): boolean {
  if (filter === "all") return true;
  const status = libraryStatus(s);
  return filter === "ready" ? status === "ready" || status === "watched" : status === filter;
}

export function statusCounts(sources: BrandSource[]): Record<LibraryStatusFilter, number> {
  const counts: Record<LibraryStatusFilter, number> = { all: sources.length, review: 0, reading: 0, ready: 0, failed: 0 };
  for (const s of sources) {
    const status = libraryStatus(s);
    counts[status === "watched" ? "ready" : status] += 1;
  }
  return counts;
}

export interface LibrarySummary {
  items: number;
  documents: number;
  notes: number;
  pages: number;
  facts: number;
  personas: number;
  samples: number;
  rules: number;
  /** Facts still waiting, and how many items hold them. */
  pending: number;
  pendingSources: number;
  newestAt: string | null;
}

/** The tiles above the library — sums over what the read returned, nothing invented. */
export function librarySummary(sources: BrandSource[]): LibrarySummary {
  const out: LibrarySummary = { items: sources.length, documents: 0, notes: 0, pages: 0, facts: 0, personas: 0, samples: 0, rules: 0, pending: 0, pendingSources: 0, newestAt: null };
  for (const s of sources) {
    if (s.kind === "url") out.pages += 1;
    else if (s.kind === "text") out.notes += 1;
    else out.documents += 1;
    out.facts += s.factCount;
    out.personas += s.personaCount;
    out.samples += s.sampleCount;
    out.rules += s.ruleCount;
    if (s.pendingCount > 0) {
      out.pending += s.pendingCount;
      out.pendingSources += 1;
    }
    if (s.uploadedAt && (!out.newestAt || s.uploadedAt > out.newestAt)) out.newestAt = s.uploadedAt;
  }
  return out;
}

/** The four stream pills on a card, in a fixed order. */
export interface StreamPill {
  key: "facts" | "personas" | "samples" | "rules";
  label: string;
  count: number;
  /** `wait` = something to review · `off` = present but switched off · `on` · `zero`. */
  tone: "wait" | "on" | "off" | "zero";
}

export function streamPills(s: BrandSource): StreamPill[] {
  const facts: StreamPill = {
    key: "facts",
    count: s.factCount,
    tone: s.factCount === 0 ? "zero" : s.pendingCount > 0 ? "wait" : "on",
    label: s.factCount === 0 ? "Facts 0" : s.pendingCount > 0 ? `Facts ${s.factCount} · ${s.pendingCount} to review` : `Facts ${s.factCount} · approved`,
  };
  const personas: StreamPill = { key: "personas", count: s.personaCount, tone: s.personaCount ? "on" : "zero", label: `Persona${s.personaCount === 1 ? "" : "s"} ${s.personaCount}` };
  const samples: StreamPill = { key: "samples", count: s.sampleCount, tone: s.sampleCount ? "on" : "zero", label: `Voice samples ${s.sampleCount}` };
  const rules: StreamPill = { key: "rules", count: s.ruleCount, tone: s.ruleCount ? "off" : "zero", label: `Rules ${s.ruleCount}` };
  return [facts, personas, samples, rules];
}

export interface LibraryFilters {
  query: string;
  tag: string | null;
  kind: SourceKind | null;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = { query: "", tag: null, kind: null };

export function filterLibrary(sources: BrandSource[], filters: LibraryFilters): BrandSource[] {
  const q = filters.query.trim().toLowerCase();
  return sources.filter((s) => {
    if (filters.tag && !s.tags.includes(filters.tag)) return false;
    if (filters.kind && s.kind !== filters.kind) return false;
    if (!q) return true;
    const hay = [s.title, s.name, s.url ?? "", ...s.tags].join(" ").toLowerCase();
    return q.split(/\s+/).every((token) => hay.includes(token));
  });
}

const STATUS_RANK: Record<LibraryStatus, number> = { review: 0, failed: 1, reading: 2, ready: 3, watched: 3 };

export function sortLibrary(sources: BrandSource[], sort: LibrarySort): BrandSource[] {
  const rows = [...sources];
  const newest = (a: BrandSource, b: BrandSource) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "") || b.id - a.id;
  switch (sort) {
    case "name":
      return rows.sort((a, b) => a.title.localeCompare(b.title));
    case "review":
      return rows.sort((a, b) => STATUS_RANK[libraryStatus(a)] - STATUS_RANK[libraryStatus(b)] || newest(a, b));
    case "taught": {
      const taught = (s: BrandSource) => s.factCount + s.personaCount + s.sampleCount + s.ruleCount;
      return rows.sort((a, b) => taught(b) - taught(a) || newest(a, b));
    }
    default:
      return rows.sort(newest);
  }
}

/** "6 facts · 1 persona · 3 samples · 2 rules", or what is pending, or the failure. */
export function taughtSummary(s: BrandSource): string {
  if (s.status === "extracting") return "Extracting…";
  if (s.status === "failed") return s.error ?? "Could not be read";
  if (s.role === "voice") return `${s.sampleCount || s.factCount} voice samples`;
  const parts: string[] = [];
  if (s.pendingCount > 0) parts.push(`${s.pendingCount} facts awaiting`);
  else parts.push(`${s.factCount} facts`);
  if (s.personaCount) parts.push(`${s.personaCount} persona${s.personaCount === 1 ? "" : "s"}`);
  if (s.sampleCount) parts.push(`${s.sampleCount} sample${s.sampleCount === 1 ? "" : "s"}`);
  if (s.ruleCount) parts.push(`${s.ruleCount} rule${s.ruleCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

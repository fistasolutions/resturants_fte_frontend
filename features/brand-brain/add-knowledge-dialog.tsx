"use client";

import { useRef, useState } from "react";
import { AlignLeft, ChevronLeft, FileImage, FileText, FileVideo, Link2, Music, Radio, UploadCloud, X } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ACCEPT_LIVE, KIND_META, parseTags, refuseReason } from "@/lib/knowledge-base";
import { cn } from "@/lib/utils";
import { addTextSource, addUrlSource, uploadSource } from "@/services/brand-brain-actions";
import type { BrandSource } from "@/types/brand-brain";

type Door = "text" | "file" | "url" | "external";

const DOORS: { key: Door; title: string; hint: string; Icon: typeof AlignLeft; comingSoon?: boolean }[] = [
  { key: "text", title: "From text", hint: "Save useful information as text", Icon: AlignLeft },
  { key: "file", title: "Upload file", hint: "Extract and analyse the contents of a file", Icon: UploadCloud },
  { key: "url", title: "Enter URL", hint: "Scan and monitor the contents of a web page", Icon: Link2 },
  { key: "external", title: "From external source", hint: "Google Drive · SharePoint", Icon: Radio, comingSoon: true },
];

const SUBTITLE: Record<Door, string> = {
  text: "Save useful information as text.",
  file: "Extract and analyse the contents of a file.",
  url: "Scan and monitor the contents of a web page.",
  external: "Add content from your connected services.",
};

const TILE_ICON: Record<string, typeof FileText> = { image: FileImage, audio: Music, video: FileVideo };

/** Tags: chips + a box that adds on Enter or comma; suggestions from the library. */
function TagsField({ tags, onChange, suggestions }: { tags: string[]; onChange: (next: string[]) => void; suggestions: string[] }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    if (!draft.trim()) return;
    onChange(parseTags(draft, tags));
    setDraft("");
  };
  const unused = suggestions.filter((s) => !tags.includes(s)).slice(0, 8);
  return (
    <div className="space-y-2">
      <Label htmlFor="kb-tags">Tags</Label>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-foreground">
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id="kb-tags"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={tags.length ? "" : "Select from existing tags or type to create new ones"}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {unused.length ? (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => onChange(parseTags(s, tags))} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Add to Knowledge Base (SPEC-267) — the Jasper-shape entry: four doors, then the
 * door's form with a name and tags. Image, audio, video and the external sources are
 * shown and marked coming soon; nothing here pretends to be built.
 */
export type AddKnowledgeStart = { door: "text" | "url" } | { door: "file"; file: File | null };

export function AddKnowledgeDialog({
  open,
  onOpenChange,
  suggestions,
  onAdded,
  start = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: string[];
  onAdded: (created: BrandSource) => void;
  /** SPEC-274: open straight on a door — the page's drop zone hands a dropped file here. */
  start?: AddKnowledgeStart | null;
}) {
  const [door, setDoor] = useState<Door | null>(null);
  const [started, setStarted] = useState<AddKnowledgeStart | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // A new `start` while open (or on open) lands on that door with its file.
  if (open && start && start !== started) {
    setStarted(start);
    setDoor(start.door);
    if (start.door === "file" && start.file) {
      const reason = refuseReason(start.file);
      setError(reason);
      setFile(reason ? null : start.file);
    }
  }
  if (!open && started) setStarted(null);

  function reset() {
    setDoor(null);
    setTitle("");
    setTags([]);
    setText("");
    setUrl("");
    setFile(null);
    setError(null);
    setBusy(false);
  }

  function pick(list: FileList | null) {
    const candidate = list?.[0];
    if (!candidate) return;
    const reason = refuseReason(candidate);
    setError(reason);
    setFile(reason ? null : candidate);
  }

  const canSubmit =
    !busy &&
    ((door === "text" && text.trim().length >= 40 && title.trim().length > 0) ||
      (door === "file" && file !== null) ||
      (door === "url" && /^https?:\/\/\S+/i.test(url.trim())));

  async function submit() {
    if (!door || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const meta = { title: title.trim() || undefined, tags };
      const created =
        door === "text"
          ? await addTextSource(title.trim(), text.trim(), tags)
          : door === "file"
            ? await uploadSource(file!, meta)
            : await addUrlSource(url.trim(), meta);
      onAdded(created);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add it — try again.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add to Knowledge Base</DialogTitle>
          <DialogDescription>
            {door ? SUBTITLE[door] : "Give Glisp and the writers information to write about the brand accurately."}
          </DialogDescription>
        </DialogHeader>

        {door === null ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DOORS.map(({ key, title: t, hint, Icon, comingSoon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDoor(key)}
                  className={cn(
                    "relative rounded-xl border border-border p-5 text-center outline-none transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring",
                    comingSoon && "opacity-70",
                  )}
                >
                  {comingSoon ? (
                    <span className="absolute top-2 right-2 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase">coming soon</span>
                  ) : null}
                  <Icon className="mx-auto size-5 text-ai" aria-hidden />
                  <span className="mt-2 block text-sm font-semibold">{t}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              You must own or have permission to use any content you add. Nothing reaches a writer until you approve what
              was extracted.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {door === "text" ? (
              <div className="space-y-2">
                <Label htmlFor="kb-text">Text</Label>
                <Textarea id="kb-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the information — a policy, a product story, a customer quote…" className="min-h-32" />
                <p className="text-[11px] text-muted-foreground">
                  At least 40 characters. Facts, personas, quoted copy and word rules are extracted and wait for your approval.
                </p>
              </div>
            ) : null}

            {door === "file" ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Choose a file"
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInput.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pick(e.dataTransfer.files);
                }}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed bg-ai/5 p-5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  dragging ? "border-foreground" : "border-border hover:border-foreground/50",
                )}
              >
                <p className="text-sm">
                  {file ? (
                    <span className="font-semibold">{file.name}</span>
                  ) : (
                    <>
                      Drag &amp; drop or <span className="font-semibold underline underline-offset-2">browse</span>
                    </>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  {KIND_META.map((k) => {
                    const Icon = TILE_ICON[k.key] ?? FileText;
                    return (
                      <span key={k.key} className={cn("w-14 text-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase", k.comingSoon && "opacity-50")}>
                        <span className="mx-auto mb-1 grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        {k.label}
                        {k.comingSoon ? <span className="block text-[8px] normal-case tracking-normal text-warning">coming soon</span> : null}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Up to 10 MB. The file is kept — open or download it any time.</p>
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPT_LIVE}
                  className="sr-only"
                  onChange={(e) => {
                    pick(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            ) : null}

            {door === "url" ? (
              <div className="space-y-2">
                <Label htmlFor="kb-url">Web address</Label>
                <Input id="kb-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourstore.com/pages/returns" />
                <p className="text-[11px] text-muted-foreground">Read now and re-read every week; a changed fact arrives as a conflict for you to decide.</p>
              </div>
            ) : null}

            {door === "external" ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Select integration</p>
                {[
                  ["Google Drive", "Connect your Google Drive to add files and shared folders."],
                  ["SharePoint", "Connect your SharePoint account to access your team's files."],
                ].map(([name, hint]) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 opacity-70">
                    <div>
                      <p className="text-sm font-semibold">
                        {name} <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase">coming soon</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                    <span className="h-5 w-9 rounded-full border border-border bg-muted" aria-hidden />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">Both need a connected account with read access. Not built yet — nothing here pretends otherwise.</p>
              </div>
            ) : null}

            {door !== "external" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="kb-title">
                    Name{door !== "text" ? <span className="ml-1 font-normal text-muted-foreground">(optional — we&apos;ll name it for you)</span> : null}
                  </Label>
                  <Input id="kb-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a name" maxLength={100} />
                </div>
                <TagsField tags={tags} onChange={setTags} suggestions={suggestions} />
              </>
            ) : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        )}

        {door !== null ? (
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="ghost" onClick={() => setDoor(null)} disabled={busy}>
              <ChevronLeft className="size-4" aria-hidden /> Back
            </Button>
            <RoleButton need="brand_brain.manage" type="button" onClick={() => void submit()} disabled={!canSubmit}>
              {busy ? "Adding…" : "Add to Knowledge Base"}
            </RoleButton>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

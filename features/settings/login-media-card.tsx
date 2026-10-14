"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, X } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CAROUSEL_MAX,
  CAROUSEL_MIN,
  IMAGE_ACCEPT,
  LOGIN_KIND_LABELS,
  VIDEO_ACCEPT,
  checkLoginMedia,
  moveItem,
  removeItem,
  type Branding,
  type LoginKind,
} from "@/lib/branding";
import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/product";

const KINDS: LoginKind[] = ["image", "video", "carousel"];
const HINT: Record<LoginKind, string> = {
  image: "One picture — JPEG, PNG or WebP, up to 10 MB.",
  video: "One MP4 or WebM video, up to 25 MB, with an optional poster picture shown while it loads.",
  carousel: `${CAROUSEL_MIN} to ${CAROUSEL_MAX} pictures, shown in this order, one every few seconds.`,
};

/** Object URLs for picked files, revoked when the files change or the card unmounts. */
function usePreviews(files: File[]): string[] {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return urls;
}

function CurrentLogin({ login }: { login: Branding["login"] }) {
  if (login.kind === "none") {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Using the {PRODUCT.short} login screen.
      </p>
    );
  }
  if (login.kind === "video") {
    return (
      <video
        src={login.items[0].url}
        poster={login.poster ?? undefined}
        controls
        muted
        playsInline
        preload="metadata"
        className="aspect-video w-full max-w-md rounded-lg border border-border bg-muted object-cover"
      />
    );
  }
  return (
    <ol className="flex flex-wrap gap-2">
      {login.items.map((item, index) => (
        <li key={item.url} className="relative">
          <Image
            src={item.url}
            alt={login.kind === "carousel" ? `Slide ${index + 1}` : "Login picture"}
            width={login.kind === "image" ? 320 : 128}
            height={login.kind === "image" ? 200 : 80}
            unoptimized
            className={cn(
              "rounded-lg border border-border object-cover",
              login.kind === "image" ? "h-48 w-80" : "h-20 w-32",
            )}
          />
          {login.kind === "carousel" ? (
            <span className="absolute top-1 left-1 rounded-md bg-background/90 px-1.5 text-xs font-medium">
              {index + 1}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function Chooser({
  onSave,
  onCancel,
}: {
  onSave: (kind: LoginKind, files: File[], poster: File | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<LoginKind>("image");
  const [files, setFiles] = useState<File[]>([]);
  const [poster, setPoster] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const previews = usePreviews(files);

  function choose(next: LoginKind) {
    setKind(next);
    setFiles([]);
    setPoster(null);
    setError(null);
  }

  function picked(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = "";
    setError(null);
    // A carousel collects pictures across picks; the others take one file.
    setFiles((current) => (kind === "carousel" ? [...current, ...chosen].slice(0, CAROUSEL_MAX) : chosen.slice(0, 1)));
  }

  async function save() {
    const problem = checkLoginMedia(kind, files, poster);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(kind, files, poster);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The login screen could not be saved.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div role="radiogroup" aria-label="Login screen shows" className="inline-flex rounded-lg border border-border p-1">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => choose(k)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LOGIN_KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{HINT[kind]}</p>

      <input
        ref={filesInput}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept={kind === "video" ? VIDEO_ACCEPT : IMAGE_ACCEPT}
        multiple={kind === "carousel"}
        onChange={picked}
      />
      <input
        ref={posterInput}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept={IMAGE_ACCEPT}
        onChange={(e) => {
          setPoster(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {files.length > 0 ? (
        kind === "video" ? (
          <video src={previews[0]} controls muted playsInline className="aspect-video w-full max-w-md rounded-lg border border-border object-cover" />
        ) : (
          <ol className="flex flex-wrap gap-3">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="space-y-1">
                <Image
                  src={previews[index]}
                  alt={file.name}
                  width={128}
                  height={80}
                  unoptimized
                  className="h-20 w-32 rounded-lg border border-border object-cover"
                />
                {kind === "carousel" ? (
                  <div className="flex items-center gap-1">
                    <span className="mr-auto text-xs text-muted-foreground">{index + 1}</span>
                    <Button type="button" size="icon" variant="ghost" className="size-7" aria-label={`Move ${file.name} earlier`} disabled={index === 0} onClick={() => setFiles((l) => moveItem(l, index, -1))}>
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-7" aria-label={`Move ${file.name} later`} disabled={index === files.length - 1} onClick={() => setFiles((l) => moveItem(l, index, 1))}>
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-7" aria-label={`Remove ${file.name}`} onClick={() => setFiles((l) => removeItem(l, index))}>
                      <X aria-hidden />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        )
      ) : null}

      <div className="flex flex-wrap gap-2">
        {kind !== "carousel" || files.length < CAROUSEL_MAX ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => filesInput.current?.click()}>
            <ImagePlus aria-hidden />
            {kind === "video" ? "Choose video" : kind === "carousel" ? "Add pictures" : "Choose picture"}
          </Button>
        ) : null}
        {kind === "video" ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => posterInput.current?.click()}>
            {poster ? `Poster: ${poster.name}` : "Add poster (optional)"}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={busy || files.length === 0} onClick={() => void save()}>
          {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {busy ? "Uploading…" : "Save login screen"}
        </Button>
      </div>
    </div>
  );
}

/**
 * The organization's login screen (SPEC-317): what it shows now, and a chooser for an image,
 * a video (with a poster) or an ordered carousel. Files are checked before they are sent.
 */
export function LoginMediaCard({
  login,
  canManage,
  onSave,
  onClear,
}: {
  login: Branding["login"];
  canManage: boolean;
  onSave: (kind: LoginKind, files: File[], poster: File | null) => Promise<void>;
  onClear: () => Promise<void>;
}) {
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  async function clear() {
    const yes = await confirm({
      title: "Remove your login screen?",
      body: `Your login page goes back to the ${PRODUCT.short} default.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!yes) return;
    setBusy(true);
    setError(null);
    try {
      await onClear();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "It could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login screen</CardTitle>
        <CardDescription>
          What your team sees beside the sign-in form
          {login.kind !== "none" ? ` — ${LOGIN_KIND_LABELS[login.kind].toLowerCase()} now` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CurrentLogin login={login} />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {canManage ? (
          choosing ? (
            <Chooser
              onSave={async (kind, files, poster) => {
                await onSave(kind, files, poster);
                setChoosing(false);
              }}
              onCancel={() => setChoosing(false)}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setChoosing(true)}>
                {login.kind === "none" ? "Set a login screen" : "Change"}
              </Button>
              {login.kind !== "none" ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void clear()}>
                  {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
                  Remove
                </Button>
              ) : null}
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

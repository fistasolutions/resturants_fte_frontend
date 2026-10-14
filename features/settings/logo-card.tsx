"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Upload } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { useConfirm } from "@/components/shared/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IMAGE_ACCEPT, checkLogo, type LogoVariant } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/product";

const COPY: Record<LogoVariant, { title: string; description: string }> = {
  light: {
    title: "For light backgrounds",
    description: "Shown in the light theme and on emails. A dark logo on a transparent background works best.",
  },
  dark: {
    title: "For dark backgrounds",
    description: "Shown in the dark theme. A light logo on a transparent background works best.",
  },
};

/**
 * One logo (SPEC-317): previewed on the surface it is for, with Upload and Remove. The file
 * is checked before it is sent; the backend's refusal is shown in its words.
 */
export function LogoCard({
  variant,
  url,
  canManage,
  onUpload,
  onRemove,
}: {
  variant: LogoVariant;
  url: string | null;
  canManage: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const copy = COPY[variant];
  const input = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The logo could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function picked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkLogo(file);
    if (problem) {
      setError(problem);
      return;
    }
    void act(() => onUpload(file));
  }

  async function remove() {
    const yes = await confirm({
      title: "Remove this logo?",
      body: `The app shows your other logo, or the ${PRODUCT.short} mark when there is none.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (yes) await act(onRemove);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* A light surface and a dark one in either theme, from tokens alone: the page
            background in its own theme, the foreground colour in the other. */}
        <div
          className={cn(
            "flex h-24 items-center justify-center rounded-lg border border-border p-4",
            variant === "light"
              ? "bg-background [--logo-paper:var(--background)] dark:bg-foreground dark:[--logo-paper:var(--foreground)]"
              : "bg-foreground [--logo-paper:var(--foreground)] dark:bg-background dark:[--logo-paper:var(--background)]",
          )}
        >
          {url ? (
            <Image
              src={url}
              alt={`Your logo ${copy.title.toLowerCase()}`}
              width={200}
              height={64}
              unoptimized
              className="h-12 w-auto max-w-full object-contain"
            />
          ) : (
            // The platform mark, drawn in the preview surface's own colours.
            <BrandLogo
              size="lg"
              paper="var(--logo-paper)"
              className={variant === "light" ? "text-foreground dark:text-background" : "text-background dark:text-foreground"}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {url ? "Your logo." : `Using the ${PRODUCT.short} logo.`} PNG, JPEG or WebP, up to 2 MB.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={picked} tabIndex={-1} />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
              {url ? "Replace" : "Upload"}
            </Button>
            {url ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void remove()}>
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

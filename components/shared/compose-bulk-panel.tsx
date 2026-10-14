"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, History, Loader2, Mail, MapPin, RefreshCw, Send, Users } from "lucide-react";

import { AttachmentChip } from "@/components/shared/attachment-chip";
import { ComposeHistorySidebar } from "@/components/shared/compose-history-sidebar";
import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { attachmentFilename, validateComposeMessage } from "@/lib/compose";
import type { Permission } from "@/lib/permissions";
import { recipientSettingsHref } from "@/lib/recipient-settings";
import type { ComposeLocation } from "@/types/compose";
import { GlispIcon } from "@/components/shared/glisp-icon";

interface ComposeBulkPanelProps {
  draftUrl: string;
  sendUrl: string;
  requestBody: Record<string, unknown>;
  backHref: string;
  attachmentPrefix: string;
  historyUrl: string;
  /** The area permission the send route needs besides `messages.send` (SPEC-358) — it depends
   * on the caller. */
  sendNeed?: readonly Permission[];
}

function messageFromError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function apiError(response: Response, fallback: string): Promise<Error> {
  const json = await response.json().catch(() => null);
  return new Error(json?.error?.message ?? `${fallback} (${response.status}).`);
}

function InlineAlert({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0"><p className="font-medium">{title}</p><div className="mt-1 text-foreground/80">{children}</div></div>
    </div>
  );
}

function BulkComposeSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-3rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-border bg-card" aria-label="Loading bulk email composer">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-64 max-w-full" /></div>
      </div>
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="space-y-2"><Skeleton className="h-3 w-14" /><Skeleton className="h-10 w-full" /></div>
        <div className="space-y-2"><div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-7 w-28" /></div><Skeleton className="h-40 w-full" /><Skeleton className="h-3 w-3/5" /></div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-44" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-4 rounded-card border border-border p-4">
              <div className="flex justify-between"><div className="flex gap-3"><Skeleton className="size-9 rounded-lg" /><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div><Skeleton className="h-6 w-20 rounded-full" /></div>
              <Skeleton className="h-10 w-full" /><Skeleton className="h-16 w-full sm:w-80" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 p-4 sm:px-6"><Skeleton className="h-3 w-48" /><div className="flex gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-28" /></div></div>
    </div>
  );
}

/** Review-before-send composer for one shared message and per-location deliveries. */
export function ComposeBulkPanel({
  draftUrl,
  sendUrl,
  requestBody,
  backHref,
  attachmentPrefix,
  historyUrl,
  sendNeed = [],
}: ComposeBulkPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Each skipped row links to its own location's field in Settings and carries
  // this page (path + filters) so the save comes straight back (SPEC-234).
  const query = searchParams.toString();
  const returnTo = query ? `${pathname}?${query}` : pathname;
  const requestBodyKey = JSON.stringify(requestBody);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const aiControllerRef = useRef<AbortController | null>(null);

  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<ComposeLocation[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generatedBy, setGeneratedBy] = useState<"ai" | "fallback" | "skipped">("skipped");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyMobileOpen, setHistoryMobileOpen] = useState(false);

  async function handleWriteWithAi() {
    const controller = new AbortController();
    aiControllerRef.current = controller;
    setAiLoading(true);
    setAiError(null);
    setSendError(null);
    try {
      const response = await fetch(draftUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(requestBodyKey), include_ai_draft: true }),
        signal: controller.signal,
      });
      if (!response.ok) throw await apiError(response, "Could not write a draft");
      const json = await response.json();
      setSubject(json.subject ?? "");
      setBody(json.body ?? "");
      setGeneratedBy(json.generated_by ?? "skipped");
      setValidationAttempted(false);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setAiError(messageFromError(caught, "Could not write a draft. Your current message is unchanged."));
    } finally {
      if (!controller.signal.aborted) setAiLoading(false);
      if (aiControllerRef.current === controller) aiControllerRef.current = null;
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch(draftUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...JSON.parse(requestBodyKey), include_ai_draft: false }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw await apiError(response, "Could not load these emails");
        const json = await response.json();
        setLocations(json.locations ?? []);
        setSubject(json.subject ?? "");
        setBody(json.body ?? "");
        // The AI draft writes itself the moment the page is ready — no
        // button, no extra click. The location list above is already
        // visible; only the subject/message show a loading state while
        // this second, slower call is in flight.
        void handleWriteWithAi();
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(messageFromError(caught, "Could not load these emails. Check your connection and try again."));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleWriteWithAi is stable for this mount; re-fetching is driven by loadAttempt/draftUrl/requestBodyKey only
  }, [draftUrl, loadAttempt, requestBodyKey]);

  useEffect(() => () => aiControllerRef.current?.abort(), []);

  const skippedCount = locations.filter((location) => !location.recipient).length;
  const sendableCount = locations.length - skippedCount;
  const validationErrors = validationAttempted ? validateComposeMessage(subject, body) : {};
  const busy = aiLoading || sending;

  async function handleSend() {
    if (busy || sendableCount === 0) return;
    setValidationAttempted(true);
    const errors = validateComposeMessage(subject, body);
    if (errors.subject || errors.body) {
      if (errors.subject) subjectRef.current?.focus();
      else bodyRef.current?.focus();
      return;
    }

    setSending(true);
    setSendError(null);
    setAiError(null);
    try {
      const response = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...JSON.parse(requestBodyKey), subject: subject.trim(), body: body.trim() }),
      });
      if (!response.ok) throw await apiError(response, "Could not send these emails");
      router.push(backHref);
    } catch (caught) {
      setSendError(messageFromError(caught, "Could not send these emails. Check your connection and try again."));
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-3rem)] min-w-0 items-stretch gap-4">
      <ComposeHistorySidebar historyUrl={historyUrl} showLocationName open={historyOpen} onOpenChange={setHistoryOpen} mobileOpen={historyMobileOpen} onMobileOpenChange={setHistoryMobileOpen} />

      {loading ? <BulkComposeSkeleton /> : null}

      {!loading && error ? (
        <div className="flex min-h-[calc(100svh-3rem)] min-w-0 flex-1 flex-col items-center justify-center rounded-card border border-border bg-card p-6 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="size-5" aria-hidden /></span>
          <h2 className="font-heading text-lg tracking-wide">We couldn&apos;t prepare these emails</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild><Link href={backHref}><ArrowLeft aria-hidden />Back to review</Link></Button>
            <Button onClick={() => { setLoading(true); setError(null); setLoadAttempt((attempt) => attempt + 1); }}><RefreshCw aria-hidden />Try again</Button>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="flex min-h-[calc(100svh-3rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-border bg-card" aria-labelledby="bulk-compose-title">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border p-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Users className="size-5" aria-hidden /></span>
              <div className="min-w-0"><h2 id="bulk-compose-title" className="font-heading text-lg tracking-wide">New bulk message</h2><p className="text-xs text-muted-foreground">One reviewed email per location</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {sendableCount > 0 ? <span className="hidden items-center gap-1.5 text-xs font-medium text-success sm:flex"><CheckCircle2 className="size-4" aria-hidden />{sendableCount} ready</span> : null}
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setHistoryMobileOpen(true)}><History aria-hidden /><span className="hidden sm:inline">History</span></Button>
            </div>
          </header>

          <div className="flex-1 space-y-8 p-4 sm:p-6">
            <section className="space-y-6" aria-labelledby="shared-message-title">
              <div><h3 id="shared-message-title" className="text-sm font-medium">Shared message</h3><p className="mt-1 text-xs text-muted-foreground">The wording below is sent separately with each location&apos;s own attachment.</p></div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="bulk-compose-subject">Subject</label>
                {aiLoading ? <Skeleton className="h-10 w-full" aria-hidden /> : (
                  <Input ref={subjectRef} id="bulk-compose-subject" value={subject} onChange={(event) => { setSubject(event.target.value); setSendError(null); }} placeholder="Add a clear subject line" disabled={sending} aria-invalid={Boolean(validationErrors.subject)} aria-describedby={validationErrors.subject ? "bulk-subject-error" : undefined} className="h-10" />
                )}
                {validationErrors.subject ? <p id="bulk-subject-error" className="text-xs text-destructive">{validationErrors.subject}</p> : null}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="bulk-compose-body">Message</label>
                  {aiLoading ? <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><GlispIcon className="size-3.5 animate-pulse text-primary" aria-hidden />Writing with AI…</span> : null}
                </div>
                {aiLoading ? (
                  <div className="min-h-40 space-y-2 rounded-lg border border-border p-3" aria-hidden aria-label="Writing an AI draft">
                    <Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" />
                  </div>
                ) : (
                  <Textarea ref={bodyRef} id="bulk-compose-body" rows={7} value={body} onChange={(event) => { setBody(event.target.value); setSendError(null); }} placeholder="Write one concise message for every location manager…" disabled={sending} aria-invalid={Boolean(validationErrors.body)} aria-describedby={validationErrors.body ? "bulk-body-error" : "bulk-body-help"} className="min-h-40 resize-y leading-6" />
                )}
                {!aiLoading ? (
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">{validationErrors.body ? <p id="bulk-body-error" className="text-destructive">{validationErrors.body}</p> : <p id="bulk-body-help">AI wrote a starting draft — you control the final wording.</p>}<span>{body.length.toLocaleString()} characters</span></div>
                ) : null}
                {generatedBy === "fallback" ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">AI was unavailable, so we prepared a reliable template using today&apos;s real data. Review it before sending.</div> : null}
                {aiError ? <InlineAlert title="AI draft wasn&apos;t created"><p>{aiError}</p></InlineAlert> : null}
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="delivery-list-title">
              <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 id="delivery-list-title" className="text-sm font-medium">Location deliveries</h3><p className="mt-1 text-xs text-muted-foreground">{locations.length} location{locations.length === 1 ? "" : "s"} · {sendableCount} ready{skippedCount > 0 ? ` · ${skippedCount} skipped` : ""}</p></div></div>
              {locations.length === 0 ? (
                <div className="rounded-card border border-dashed border-border p-8 text-center"><MapPin className="mx-auto size-5 text-muted-foreground" aria-hidden /><p className="mt-3 text-sm font-medium">No pending locations</p><p className="mt-1 text-xs text-muted-foreground">There are no location emails available to send.</p></div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location, index) => {
                    const ready = Boolean(location.recipient);
                    return (
                      <article key={location.location_id ?? `${location.name}-${index}`} className="overflow-hidden rounded-card border border-border bg-card">
                        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 p-4">
                          <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border"><MapPin className="size-4 text-muted-foreground" aria-hidden /></span><div><h4 className="text-sm font-medium">{location.name}</h4><p className="mt-0.5 text-xs text-muted-foreground">Email {index + 1} of {locations.length}</p></div></div>
                          <span className={ready ? "inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success" : "inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"}>{ready ? <CheckCircle2 className="size-3.5" aria-hidden /> : <AlertCircle className="size-3.5" aria-hidden />}{ready ? "Ready" : "Will be skipped"}</span>
                        </header>
                        <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,auto)] xl:items-end">
                          <div className="space-y-2"><p className="text-xs font-medium text-muted-foreground">Recipient</p>{location.recipient ? <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><Input value={location.recipient} readOnly className="h-10 bg-muted/30 pl-10 pr-10" aria-label={`${location.name} recipient`} /><CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success" aria-hidden /></div> : <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3"><AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden /><div><p className="text-sm font-medium">Manager email required</p><p className="mt-1 text-xs text-muted-foreground">This location will be skipped. Add its manager email in Settings to include it.</p><Button variant="outline" size="sm" className="mt-3" asChild><Link href={recipientSettingsHref({ kind: "location", locationId: location.location_id }, returnTo)}>Open Settings</Link></Button></div></div>}</div>
                          <div className="min-w-0 space-y-2"><p className="text-xs font-medium text-muted-foreground">Attachment</p><AttachmentChip filename={attachmentFilename(attachmentPrefix, location.name)} rowCount={location.row_count} attachment={location.attachment} /></div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {sendError ? <InlineAlert title="Emails not sent"><p>{sendError}</p></InlineAlert> : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">{sendableCount > 0 ? `${sendableCount} separate email${sendableCount === 1 ? "" : "s"} will be sent after confirmation.` : "Add at least one manager email before sending."}</p>
            <div className="flex items-center justify-end gap-2"><Button variant="ghost" asChild><Link href={backHref}>Cancel</Link></Button><RoleButton need={["messages.send", ...sendNeed]} onClick={() => void handleSend()} disabled={busy || sendableCount === 0} className="min-w-32">{sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}{sending ? "Sending…" : `Send ${sendableCount || "all"}`}</RoleButton></div>
          </footer>
          <p className="sr-only" aria-live="polite">{aiLoading ? "Writing an AI draft" : sending ? `Sending ${sendableCount} emails` : ""}</p>
        </section>
      ) : null}
    </div>
  );
}

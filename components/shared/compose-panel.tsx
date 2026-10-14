"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, History, Loader2, Mail, RefreshCw, Send } from "lucide-react";

import { AttachmentChip } from "@/components/shared/attachment-chip";
import { ComposeHistorySidebar } from "@/components/shared/compose-history-sidebar";
import { RoleButton } from "@/components/shared/role-gate";
import { formatDateTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { validateComposeMessage } from "@/lib/compose";
import type { Permission } from "@/lib/permissions";
import {
  recipientLabel,
  recipientSettingsHref,
  withLocationId,
  type RecipientSetting,
} from "@/lib/recipient-settings";
import type { ComposeAttachment, ComposeHistoryItem } from "@/types/compose";
import { GlispIcon } from "@/components/shared/glisp-icon";

function formatSentAt(iso: string): string {
  return formatDateTime(iso); // store (NY) time — SPEC-129
}

interface ComposePanelProps {
  draftUrl: string;
  sendUrl: string;
  requestBody: Record<string, unknown>;
  backHref: string;
  /** Filename shown on the attachment chip, e.g. "overdue-orders-jackson.csv". */
  attachmentFilename: string;
  historyUrl: string;
  /** Where this flow's recipient is configured (SPEC-234) — the "Open
   * Settings" button lands on that exact field and comes back here. */
  recipientSetting: RecipientSetting;
  /** The area permission the send route needs besides `messages.send` (SPEC-358) — it depends
   * on the caller, e.g. `results.view` for a manager report card. */
  sendNeed?: readonly Permission[];
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const json = await response.json().catch(() => null);
  return new Error(json?.error?.message ?? `${fallback} (${response.status}).`);
}

function InlineAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ComposeSkeleton() {
  return (
    <div className="min-h-[calc(100svh-3rem)] min-w-0 flex-1 overflow-hidden rounded-card border border-border bg-card" aria-label="Loading email composer">
      <div className="flex items-center gap-3 border-b border-border p-6">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-52" />
        </div>
      </div>
      <div className="space-y-6 p-6">
        <div className="space-y-2"><Skeleton className="h-3 w-12" /><Skeleton className="h-9 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-9 w-full" /></div>
        <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-48 w-full" /></div>
        <Skeleton className="h-16 w-full sm:w-80" />
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-muted/30 p-4">
        <Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

/** Shared review-before-send composer for all single-recipient send flows. */
export function ComposePanel({
  draftUrl,
  sendUrl,
  requestBody,
  backHref,
  attachmentFilename,
  historyUrl,
  recipientSetting,
  sendNeed = [],
}: ComposePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestBodyKey = JSON.stringify(requestBody);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const aiControllerRef = useRef<AbortController | null>(null);

  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [draftLocationId, setDraftLocationId] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<ComposeAttachment | null>(null);
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
  // Clicking a history card shows its saved content here, read-only — the
  // compose form's own state (subject/body/recipient/attachment above) is
  // never touched, so returning to "New message" needs no refetch/redraft.
  const [viewingItem, setViewingItem] = useState<ComposeHistoryItem | null>(null);

  // The "Open Settings" link points at the exact field that is missing and
  // carries this page (path + filters) so the save can bring the owner
  // straight back (SPEC-234). A discount review only learns its location from
  // the draft, hence the upgrade from `draftLocationId`.
  const resolvedSetting = withLocationId(recipientSetting, draftLocationId);
  const query = searchParams.toString();
  const settingsHref = recipientSettingsHref(resolvedSetting, query ? `${pathname}?${query}` : pathname);

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
      if (!response.ok) throw await responseError(response, "Could not write a draft");
      const json = await response.json();
      setSubject(json.subject ?? "");
      setBody(json.body ?? "");
      setGeneratedBy(json.generated_by ?? "skipped");
      setValidationAttempted(false);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setAiError(errorMessage(caught, "Could not write a draft. Your current message is unchanged."));
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
        if (!response.ok) throw await responseError(response, "Could not load this email");
        const json = await response.json();
        setRecipient(json.recipient);
        setDraftLocationId(typeof json.location_id === "number" ? json.location_id : null);
        setAttachment(json.attachment);
        setSubject(json.subject ?? "");
        setBody(json.body ?? "");
        // The AI draft writes itself the moment the page is ready — no
        // button, no extra click. The recipient/attachment above are
        // already visible; only the subject/message show a loading state
        // while this second, slower call is in flight.
        void handleWriteWithAi();
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(errorMessage(caught, "Could not load this email. Check your connection and try again."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleWriteWithAi is stable for this mount; re-fetching is driven by loadAttempt/draftUrl/requestBodyKey only
  }, [draftUrl, loadAttempt, requestBodyKey]);

  useEffect(() => () => aiControllerRef.current?.abort(), []);

  const validationErrors = validationAttempted ? validateComposeMessage(subject, body) : {};
  const busy = aiLoading || sending;

  async function handleSend() {
    if (busy || !recipient) return;
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
      if (!response.ok) throw await responseError(response, "Could not send this email");
      router.push(backHref);
    } catch (caught) {
      setSendError(errorMessage(caught, "Could not send this email. Check your connection and try again."));
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-3rem)] min-w-0 items-stretch gap-4">
      <ComposeHistorySidebar
        historyUrl={historyUrl}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        mobileOpen={historyMobileOpen}
        onMobileOpenChange={setHistoryMobileOpen}
        selectedId={viewingItem?.id ?? null}
        onSelectItem={setViewingItem}
      />

      {loading ? <ComposeSkeleton /> : null}

      {!loading && error ? (
        <div className="flex min-h-[calc(100svh-3rem)] min-w-0 flex-1 flex-col items-center justify-center rounded-card border border-border bg-card p-6 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" aria-hidden />
          </span>
          <h2 className="font-heading text-lg tracking-wide">We couldn&apos;t open this email</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild><Link href={backHref}><ArrowLeft aria-hidden />Back to review</Link></Button>
            <Button onClick={() => { setLoading(true); setError(null); setLoadAttempt((attempt) => attempt + 1); }}><RefreshCw aria-hidden />Try again</Button>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <section className="flex min-h-[calc(100svh-3rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-border bg-card" aria-labelledby="compose-card-title">
          <header className="flex items-center justify-between gap-4 border-b border-border p-4 sm:p-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Mail className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 id="compose-card-title" className="font-heading text-lg tracking-wide">
                  {viewingItem ? "Sent email" : "New message"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {viewingItem
                    ? "Exactly what was sent — not a re-generated copy."
                    : "Review every detail before sending"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {viewingItem ? (
                <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>
                  <ArrowLeft aria-hidden />New message
                </Button>
              ) : (
                <>
                  {recipient ? (
                    <span className="hidden items-center gap-1.5 text-xs font-medium text-success sm:flex">
                      <CheckCircle2 className="size-4" aria-hidden />Ready to send
                    </span>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setHistoryMobileOpen(true)}
                    aria-label="Open send history"
                  >
                    <History aria-hidden />
                    <span className="hidden sm:inline">History</span>
                  </Button>
                </>
              )}
            </div>
          </header>

          {viewingItem ? (
            <div className="flex-1 space-y-6 p-4 sm:p-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Recipient</p>
                <p className="text-sm text-foreground">{viewingItem.recipient ?? "—"}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Subject</p>
                <p className="text-sm font-medium text-foreground">
                  {viewingItem.subject || <span className="italic text-muted-foreground">No subject</span>}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Sent</p>
                <p className="text-sm text-foreground">{formatSentAt(viewingItem.sent_at)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Message</p>
                <p className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6 text-foreground scrollbar-subtle">
                  {viewingItem.body || "—"}
                </p>
              </div>
              {viewingItem.attachment ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Attachment</p>
                  <AttachmentChip
                    filename={attachmentFilename}
                    rowCount={viewingItem.attachment.rows.length}
                    attachment={viewingItem.attachment}
                  />
                </div>
              ) : null}
            </div>
          ) : (
          <div className="flex-1 space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="compose-to">Recipient</label>
              {recipient ? (
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input id="compose-to" value={recipient} readOnly className="h-10 bg-muted/30 pl-10 pr-10" />
                  <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success" aria-hidden />
                </div>
              ) : (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <div>
                      <p className="text-sm font-medium text-foreground">Manager email required</p>
                      <p className="mt-1 text-sm text-muted-foreground">Add {recipientLabel(resolvedSetting)} before you can send this message.</p>
                      <Button variant="outline" size="sm" className="mt-3" asChild><Link href={settingsHref}>Open Settings</Link></Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="compose-subject">Subject</label>
              {aiLoading ? (
                <Skeleton className="h-10 w-full" aria-hidden />
              ) : (
                <Input
                  ref={subjectRef}
                  id="compose-subject"
                  value={subject}
                  onChange={(event) => { setSubject(event.target.value); setSendError(null); }}
                  placeholder="Add a clear subject line"
                  disabled={sending}
                  aria-invalid={Boolean(validationErrors.subject)}
                  aria-describedby={validationErrors.subject ? "compose-subject-error" : undefined}
                  className="h-10"
                />
              )}
              {validationErrors.subject ? <p id="compose-subject-error" className="text-xs text-destructive">{validationErrors.subject}</p> : null}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="compose-body">Message</label>
                {aiLoading ? (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <GlispIcon className="size-3.5 animate-pulse text-primary" aria-hidden />
                    Writing with AI…
                  </span>
                ) : null}
              </div>
              {aiLoading ? (
                <div className="min-h-56 space-y-2 rounded-lg border border-border p-3" aria-hidden aria-label="Writing an AI draft">
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              ) : (
                <Textarea
                  ref={bodyRef}
                  id="compose-body"
                  rows={10}
                  value={body}
                  onChange={(event) => { setBody(event.target.value); setSendError(null); }}
                  placeholder="Write a concise note for the location manager…"
                  disabled={sending}
                  aria-invalid={Boolean(validationErrors.body)}
                  aria-describedby={validationErrors.body ? "compose-body-error" : "compose-body-help"}
                  className="min-h-56 resize-y leading-6"
                />
              )}
              {!aiLoading ? (
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  {validationErrors.body ? <p id="compose-body-error" className="text-destructive">{validationErrors.body}</p> : <p id="compose-body-help">AI wrote a starting draft — you stay in control of the final wording.</p>}
                  <span aria-label={`${body.length} characters`}>{body.length.toLocaleString()} characters</span>
                </div>
              ) : null}
              {generatedBy === "fallback" ? (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
                  AI was unavailable, so we prepared a reliable template using today&apos;s real data. Review it before sending.
                </div>
              ) : null}
              {aiError ? <InlineAlert><p className="font-medium">AI draft wasn&apos;t created</p><p className="mt-1 text-foreground/80">{aiError}</p></InlineAlert> : null}
            </div>

            {attachment ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Attachment</p>
                  <p className="mt-1 text-xs text-muted-foreground">Generated from the latest overdue-order data.</p>
                </div>
                <AttachmentChip
                  filename={attachmentFilename}
                  rowCount={attachment.rows.length}
                  attachment={attachment}
                />
              </div>
            ) : null}

            {sendError ? <InlineAlert><p className="font-medium">Message not sent</p><p className="mt-1 text-foreground/80">{sendError}</p></InlineAlert> : null}
          </div>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            {viewingItem ? (
              <>
                <p className="text-xs text-muted-foreground">A past record — nothing here can be edited or resent.</p>
                <Button variant="ghost" onClick={() => setViewingItem(null)}>
                  <ArrowLeft aria-hidden />Back to new message
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Nothing is sent until you confirm.</p>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" asChild><Link href={backHref}>Cancel</Link></Button>
                  <RoleButton need={["messages.send", ...sendNeed]} onClick={() => void handleSend()} disabled={busy || !recipient} className="min-w-28">
                    {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
                    {sending ? "Sending…" : "Send email"}
                  </RoleButton>
                </div>
              </>
            )}
          </footer>
          <p className="sr-only" aria-live="polite">{aiLoading ? "Writing an AI draft" : sending ? "Sending email" : ""}</p>
        </section>
      ) : null}
    </div>
  );
}

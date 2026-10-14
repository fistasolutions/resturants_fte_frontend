"use client";

import { useMemo } from "react";
import { ChevronRight, Ellipsis, ExternalLink, FileText, ImageIcon, MapPin, Paperclip, Receipt } from "lucide-react";

import {
  attachmentKind,
  formatBytes,
  parseMessageBody,
  senderInitial,
  type EarlierMessage,
  type InlineToken,
  type MessageBlock,
  type MessageLine,
} from "@/lib/message-body";
import { cn } from "@/lib/utils";
import type { MessageAttachment } from "@/types/customer-support";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

function Token({ token }: { token: InlineToken }) {
  if (token.kind === "text") return <>{token.text}</>;
  if (token.kind === "email") {
    return (
      <a href={token.href} className="text-primary underline-offset-2 hover:underline">
        {token.label}
      </a>
    );
  }
  if (token.kind === "image") {
    return (
      <a
        href={token.href}
        {...EXTERNAL}
        className="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 align-baseline text-xs text-muted-foreground hover:text-foreground"
      >
        <ImageIcon className="size-3 shrink-0" aria-hidden />
        <span className="truncate">{token.label}</span>
      </a>
    );
  }
  if (token.compact) {
    return (
      <a
        href={token.href}
        {...EXTERNAL}
        title={token.href}
        className="mx-0.5 inline-flex max-w-full items-center gap-1 rounded-md bg-primary/10 px-1.5 align-baseline text-xs text-primary hover:bg-primary/15"
      >
        <span className="truncate">{token.label}</span>
        <ExternalLink className="size-3 shrink-0" aria-hidden />
      </a>
    );
  }
  return (
    <a href={token.href} {...EXTERNAL} title={token.href} className="text-primary underline underline-offset-2 hover:decoration-2">
      {token.label}
    </a>
  );
}

function Paragraph({ lines }: { lines: MessageLine[] }) {
  return (
    <p className="min-w-0 [overflow-wrap:anywhere]">
      {lines.map((line, l) => (
        <span key={l}>
          {l > 0 ? <br /> : null}
          {line.map((token, t) => (
            <Token key={t} token={token} />
          ))}
        </span>
      ))}
    </p>
  );
}

/** A billing, shipping or delivery address as a small card. */
function AddressCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
      <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        <MapPin className="size-3" aria-hidden />
        {title}
      </p>
      <address className="text-[13px] leading-snug not-italic text-foreground [overflow-wrap:anywhere]">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}

/** An order as a receipt: items with quantity and total, then the totals, the grand total bold. */
function OrderReceipt({ block }: { block: Extract<MessageBlock, { kind: "order" }> }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <p className="flex items-center gap-1 border-b border-border px-3 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        <Receipt className="size-3" aria-hidden />
        Order
      </p>
      <table className="w-full table-fixed text-[13px]">
        <thead className="sr-only">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Quantity</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {block.items.map((item, i) => (
            <tr key={i} className="align-top">
              <td className="px-3 py-1.5 text-foreground [overflow-wrap:anywhere]">{item.name}</td>
              <td className="w-12 py-1.5 text-right text-muted-foreground tabular-nums">{item.quantity ? `×${item.quantity}` : ""}</td>
              <td className="w-24 px-3 py-1.5 text-right text-foreground tabular-nums">{item.total ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {block.totals.length ? (
        <dl className="space-y-0.5 border-t border-border bg-muted/30 px-3 py-2 text-[13px]">
          {block.totals.map((row, i) => (
            <div key={i} className={cn("flex min-w-0 items-baseline justify-between gap-3", row.grand && "mt-1 border-t border-border pt-1 font-semibold text-foreground")}>
              <dt className={cn("min-w-0 [overflow-wrap:anywhere]", !row.grand && "text-muted-foreground")}>{row.label}</dt>
              <dd className="shrink-0 tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

type AddressBlock = Extract<MessageBlock, { kind: "address" }>;

/** The blocks in order; consecutive addresses (billing and shipping) sit side by side. */
function Blocks({ blocks }: { blocks: MessageBlock[] }) {
  const groups: (MessageBlock | AddressBlock[])[] = [];
  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block.kind === "address" && Array.isArray(last)) last.push(block);
    else groups.push(block.kind === "address" ? [block] : block);
  }
  return (
    <>
      {groups.map((group, i) =>
        Array.isArray(group) ? (
          <div key={i} className="grid min-w-0 gap-2 sm:grid-cols-2">
            {group.map((address, a) => (
              <AddressCard key={a} title={address.title} lines={address.lines} />
            ))}
          </div>
        ) : group.kind === "paragraph" ? (
          <Paragraph key={i} lines={group.lines} />
        ) : group.kind === "order" ? (
          <OrderReceipt key={i} block={group} />
        ) : null,
      )}
    </>
  );
}

/** A footer or signature, folded behind "···" the way mail clients trim it. */
function FooterToggle({ blocks }: { blocks: MessageBlock[] }) {
  if (!blocks.length) return null;
  return (
    <details className="group/footer min-w-0">
      <summary
        className="inline-flex cursor-pointer list-none items-center rounded-md border border-border bg-muted/60 px-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
        aria-label="Show the footer"
        title="Show the footer"
      >
        <Ellipsis className="size-4" aria-hidden />
      </summary>
      <div className="mt-1.5 min-w-0 space-y-1.5 text-xs text-muted-foreground">
        <Blocks blocks={blocks} />
      </div>
    </details>
  );
}

/** One quoted message as a card: who, their address, when, what they wrote. */
function EarlierCard({ message }: { message: EarlierMessage }) {
  return (
    <li className="min-w-0 rounded-xl border border-border bg-background/60 p-3">
      <div className="mb-2 flex min-w-0 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground" aria-hidden>
          {senderInitial(message)}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs">
          <span className="font-semibold text-foreground">{message.from ?? message.email ?? "Earlier message"}</span>
          {message.from && message.email ? <span className="text-muted-foreground"> · {message.email}</span> : null}
        </span>
        {message.date ? <span className="shrink-0 text-[11px] text-muted-foreground">{message.date}</span> : null}
      </div>
      <div className="min-w-0 space-y-2 text-[13px] leading-relaxed text-foreground/90">
        <Blocks blocks={message.body} />
        <FooterToggle blocks={message.footer} />
      </div>
    </li>
  );
}

function Attachment({ file }: { file: MessageAttachment }) {
  const kind = attachmentKind(file.contentType, file.name);
  const size = formatBytes(file.size);
  return (
    <li className="min-w-0">
      <a
        href={file.url}
        {...EXTERNAL}
        title={file.name}
        className="flex w-56 max-w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-background p-1.5 pr-3 transition-colors hover:border-foreground/30"
      >
        {kind === "image" ? (
          // Helpdesk-hosted files; a thumbnail, lazily loaded, no referrer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-lg bg-muted object-cover" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {kind === "pdf" ? <FileText className="size-5" aria-hidden /> : <Paperclip className="size-5" aria-hidden />}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-foreground">{file.name}</span>
          <span className="block text-[11px] text-muted-foreground">
            {[kind === "pdf" ? "PDF" : kind === "image" ? "Image" : "File", size].filter(Boolean).join(" · ")}
          </span>
        </span>
      </a>
    </li>
  );
}

/**
 * One message's text as an email client shows it (SPEC-348): the new words as paragraphs with
 * real links, the footer folded behind "···", the attachments as chips, and the earlier
 * exchange behind "Show N earlier messages" — one card per message, with who sent it and when.
 * Nothing in it can widen the page — every paragraph wraps anywhere.
 */
export function MessageBody({
  body,
  strippedBody,
  attachments,
  className,
}: {
  body: string;
  strippedBody?: string | null;
  attachments?: MessageAttachment[];
  className?: string;
}) {
  const parsed = useMemo(() => parseMessageBody(body, strippedBody), [body, strippedBody]);
  const files = attachments ?? [];
  return (
    <div className={cn("min-w-0 space-y-2 text-sm leading-relaxed text-foreground", className)}>
      {parsed.visible.length ? <Blocks blocks={parsed.visible} /> : <p className="text-muted-foreground italic">No text</p>}
      <FooterToggle blocks={parsed.footer} />
      {files.length ? (
        <ul className="flex flex-wrap gap-2 pt-0.5" aria-label={`${files.length} ${files.length === 1 ? "attachment" : "attachments"}`}>
          {files.map((file) => (
            <Attachment key={file.url} file={file} />
          ))}
        </ul>
      ) : null}
      {parsed.earlier.length ? (
        <details className="group min-w-0">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md px-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-3.5 transition-transform duration-150 group-open:rotate-90" aria-hidden />
            <span className="group-open:hidden">
              Show {parsed.earlier.length} earlier {parsed.earlier.length === 1 ? "message" : "messages"}
            </span>
            <span className="hidden group-open:inline">Hide earlier messages</span>
          </summary>
          <ol className="mt-2 min-w-0 space-y-2" aria-label="Earlier messages">
            {parsed.earlier.map((message, index) => (
              <EarlierCard key={index} message={message} />
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}


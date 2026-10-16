"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Plus, Send, Trash2 } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  addLine,
  draftFrom,
  eventLine,
  quotableDishes,
  removeLine,
  type DraftLine,
} from "@/lib/catering";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { cn } from "@/lib/utils";
import { quoteCateringInquiry, sendCateringQuote, updateCateringInquiry } from "@/services/restaurant-os-actions";
import type { CateringInquiry, CateringStatus } from "@/types/restaurant-os";
import { formatCurrency } from "@/utils/format";

const SELECT =
  "h-9 rounded-input border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

function QuoteBuilder({ inquiry, onSaved }: { inquiry: CateringInquiry; onSaved: () => Promise<void> }) {
  const menu = useApiQuery(inquiry.branchId ? restaurantQueries.branchMenu(inquiry.branchId) : null);
  const dishes = quotableDishes(menu.data);
  const [lines, setLines] = useState<DraftLine[]>(draftFrom(inquiry));
  const [dish, setDish] = useState("");
  const [qty, setQty] = useState("1");
  const [fee, setFee] = useState(String(inquiry.quote.deliveryFee || 0));
  const [note, setNote] = useState(inquiry.quote.note ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const names = new Map(dishes.map((d) => [d.id, d.name]));
  const closed = inquiry.status === "won" || inquiry.status === "lost";

  const run = async (key: string, body: () => Promise<unknown>) => {
    setBusy(key);
    setError(null);
    try {
      await body();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  };

  if (!inquiry.branchId) return <p className="text-sm text-muted-foreground">Assign a branch to quote from its menu.</p>;
  if (menu.isError) return <QueryErrorState error={menu.error} onRetry={() => void menu.refetch()} />;

  return (
    <div className="space-y-3">
      {!closed ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`dish-${inquiry.id}`} className="text-xs text-muted-foreground">
              Dish
            </Label>
            <select id={`dish-${inquiry.id}`} className={SELECT} value={dish} onChange={(e) => setDish(e.target.value)}>
              <option value="">Choose a dish</option>
              {dishes.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.section} · {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`qty-${inquiry.id}`} className="text-xs text-muted-foreground">
              Quantity
            </Label>
            <Input id={`qty-${inquiry.id}`} type="number" min={1} max={1000} value={qty} onChange={(e) => setQty(e.target.value)} className="h-9 w-24" />
          </div>
          <RoleButton
            need={["network.manage"]}
            size="sm"
            variant="outline"
            disabled={!dish || !Number(qty)}
            onClick={() => {
              setLines((current) => addLine(current, Number(dish), Number(qty)));
              setDish("");
              setQty("1");
            }}
          >
            <Plus aria-hidden /> Add
          </RoleButton>
        </div>
      ) : null}
      {lines.length ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {lines.map((line) => {
            const saved = inquiry.quote.lines.find((l) => l.menuItemId === line.menuItemId && l.quantity === line.quantity);
            return (
              <li key={line.menuItemId} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1">
                  {names.get(line.menuItemId) ?? saved?.name ?? `Dish ${line.menuItemId}`} × {line.quantity}
                </span>
                {saved ? <span className="tabular-nums text-muted-foreground">{formatCurrency(saved.amount)}</span> : null}
                {!closed ? (
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setLines((current) => removeLine(current, line.menuItemId))}
                    className="rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {!closed ? (
        <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
          <div className="space-y-1">
            <Label htmlFor={`fee-${inquiry.id}`} className="text-xs text-muted-foreground">
              Delivery fee
            </Label>
            <Input id={`fee-${inquiry.id}`} type="number" min={0} step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`note-${inquiry.id}`} className="text-xs text-muted-foreground">
              Note to the guest
            </Label>
            <Textarea id={`note-${inquiry.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      ) : null}
      {inquiry.quote.lines.length ? (
        <p className="text-sm">
          Quote total <span className="font-semibold tabular-nums">{formatCurrency(inquiry.quote.total)}</span>
          <span className="text-muted-foreground">
            {" "}
            ({formatCurrency(inquiry.quote.subtotal)} + {formatCurrency(inquiry.quote.deliveryFee)} delivery)
          </span>
        </p>
      ) : null}
      <FormError message={error} />
      {!closed ? (
        <div className="flex flex-wrap gap-2">
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy !== null || lines.length === 0}
            onClick={() => void run("quote", () => quoteCateringInquiry(inquiry.id, lines, Number(fee) || 0, note.trim() || null))}
          >
            {busy === "quote" ? "Pricing…" : "Price the quote"}
          </RoleButton>
          <RoleButton
            need={["network.manage"]}
            size="sm"
            variant="outline"
            disabled={busy !== null || inquiry.quote.lines.length === 0 || !inquiry.email}
            title={!inquiry.email ? "This guest left no email — call them with the quote." : undefined}
            onClick={() => void run("send", () => sendCateringQuote(inquiry.id))}
          >
            <Send aria-hidden /> {inquiry.quotedAt ? "Send again" : "Send the quote"}
          </RoleButton>
        </div>
      ) : null}
    </div>
  );
}

function InquiryCard({
  inquiry,
  branches,
  onChanged,
}: {
  inquiry: CateringInquiry;
  branches: { id: number; label: string }[];
  onChanged: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const change = async (body: { branchId?: number; status?: CateringStatus }) => {
    setError(null);
    try {
      await updateCateringInquiry(inquiry.id, body);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    }
  };
  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground">{inquiry.name}</span>
        <Badge variant={inquiry.status === "new" ? "default" : "secondary"}>{STATUS_LABELS[inquiry.status]}</Badge>
        <span className="text-sm text-muted-foreground">{eventLine(inquiry)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {inquiry.email ? (
          <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
            <Mail className="size-4" aria-hidden /> {inquiry.email}
          </a>
        ) : null}
        {inquiry.phone ? (
          <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
            <Phone className="size-4" aria-hidden /> {inquiry.phone}
          </a>
        ) : null}
        {inquiry.address ? <span>{inquiry.address}</span> : null}
      </div>
      {inquiry.notes ? <p className="text-sm text-foreground">“{inquiry.notes}”</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={`branch-${inquiry.id}`} className="text-xs text-muted-foreground">
          Branch
        </Label>
        <select
          id={`branch-${inquiry.id}`}
          className={SELECT}
          value={inquiry.branchId ?? ""}
          onChange={(e) => e.target.value && void change({ branchId: Number(e.target.value) })}
        >
          <option value="">Not assigned</option>
          {branches.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.label}
            </option>
          ))}
        </select>
        {inquiry.status === "quoted" || inquiry.status === "new" ? (
          <>
            <RoleButton need={["network.manage"]} size="sm" variant="outline" onClick={() => void change({ status: "won" })}>
              Won
            </RoleButton>
            <RoleButton need={["network.manage"]} size="sm" variant="outline" onClick={() => void change({ status: "lost" })}>
              Lost
            </RoleButton>
          </>
        ) : null}
      </div>
      <FormError message={error} />
      <QuoteBuilder key={`${inquiry.branchId}-${inquiry.quotedAt}-${inquiry.quote.total}`} inquiry={inquiry} onSaved={onChanged} />
    </li>
  );
}

/** The Catering Desk (SPEC-391 over backend SPEC-410). */
export function CateringView() {
  const queryClient = useQueryClient();
  const data = useApiQuery(restaurantQueries.catering());
  const branches = useApiQuery(restaurantQueries.branches({ status: "open" }));
  const [status, setStatus] = useState<CateringStatus | "all">("new");
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "catering"] });
    await queryClient.invalidateQueries({ queryKey: ["employees"] });
  };

  if (data.isError) return <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <RestaurantSkeleton tiles={0} />;
  const page = data.data;
  const shown = status === "all" ? page.inquiries : page.inquiries.filter((i) => i.status === status);
  const branchOptions = (branches.data ?? []).map((b) => ({ id: b.id, label: `#${b.code} ${b.name}` }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter inquiries">
        {(["new", "quoted", "won", "lost", "all"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={status === key}
            onClick={() => setStatus(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              status === key ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
            )}
          >
            {key === "all" ? "All" : STATUS_LABELS[key]}{" "}
            <span className="tabular-nums">
              {key === "all" ? STATUS_ORDER.reduce((n, s) => n + page.counts[s], 0) : page.counts[key]}
            </span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyPanel
          title={status === "new" ? "No new inquiries" : "Nothing here"}
          body="Guests ask for catering from the Catering form on your locations site; each inquiry lands here to quote."
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} branches={branchOptions} onChanged={refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}

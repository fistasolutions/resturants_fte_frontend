"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Check, ChevronDown, LoaderCircle } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCan } from "@/hooks/use-can";
import type { DiscountEmployee } from "@/types/discounts";

type RowState = "idle" | "saving" | "saved" | "error";

async function saveName(staffUserId: number, name: string): Promise<void> {
  const res = await fetch(`/api/proxy/discounts/staff/${staffUserId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staff_name: name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Could not save this name.");
  }
}

function Row({ staffUserId }: { staffUserId: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState<RowState>("idle");
  const can = useCan();
  const canName = can("discounts.manage").allowed;

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setState("error");
      return;
    }
    setState("saving");
    try {
      await saveName(staffUserId, trimmed);
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      <span className="w-28 shrink-0 text-sm text-muted-foreground tabular-nums">
        Staff {staffUserId}
      </span>
      <Label htmlFor={`staff-${staffUserId}`} className="sr-only">
        Name for staff {staffUserId}
      </Label>
      <Input
        id={`staff-${staffUserId}`}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (state !== "idle") setState("idle");
        }}
        placeholder="Staff member's name"
        disabled={!canName}
        className="h-8 text-sm"
      />
      <RoleButton
        need="discounts.manage"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void handleSave()}
        disabled={state === "saving"}
      >
        {state === "saving" ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : state === "saved" ? (
          <Check className="size-3.5 text-success" aria-hidden />
        ) : (
          "Save"
        )}
      </RoleButton>
    </div>
  );
}

/** Unmapped POS staff who entered manual discounts (SPEC-098) — surfaced, never
 * dropped, with an inline way to put a name on the raw Shopify id (their name
 * isn't available from the API; the Users endpoint is Plus-only). */
export function UnmappedStaffBanner({ employees }: { employees: DiscountEmployee[] }) {
  const [open, setOpen] = useState(false);
  const ids = employees
    .filter((e) => e.staff_user_id !== null && !e.mapped)
    .map((e) => e.staff_user_id as number);
  if (ids.length === 0) return null;

  return (
    <div className="rounded-card border border-warning/30 bg-warning/10 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {ids.length} staff member{ids.length === 1 ? "" : "s"} aren&apos;t named yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            They entered manual discounts but show as a Shopify id — name them so the reports read
            clearly.
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
          {open ? "Hide" : "Name staff"}
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2">
          {ids.map((id) => (
            <Row key={id} staffUserId={id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, PenLine, Plus, Store } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { FieldDialog } from "@/features/restaurant-os/field-dialog";
import { useApiQuery } from "@/hooks/use-api-query";
import { OPENING_LABELS, PROSPECT_LABELS, movableOpeningStages, movableProspectStages } from "@/lib/development";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { parsePercentRate, parseStoreCode } from "@/lib/restaurant-forms";
import {
  addOpening,
  addProspect,
  openStore,
  signProspect,
  updateOpening,
  updateProspect,
} from "@/services/restaurant-os-actions";
import type { Opening, OpeningStage, Prospect, ProspectStage } from "@/types/restaurant-os";

const SELECT =
  "h-8 rounded-input border border-input bg-background px-2 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

/** Franchise development (SPEC-395 over backend SPEC-416): prospects and new-store openings. */
export function DevelopmentView() {
  const queryClient = useQueryClient();
  const data = useApiQuery(restaurantQueries.development());
  const franchisees = useApiQuery(restaurantQueries.franchisees());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prospect, setProspect] = useState({ name: "", market: "", email: "", phone: "", nextStep: "", nextStepOn: "" });
  const [opening, setOpening] = useState({ franchiseeId: 0, name: "", city: "", targetOpenOn: "" });
  const [signing, setSigning] = useState<Prospect | null>(null);
  const [toOpen, setToOpen] = useState<Opening | null>(null);

  const refresh = () =>
    Promise.all(
      ["development", "franchisees", "branches"].map((key) => queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, key] })),
    );

  const run = async (body: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await body();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };

  if (data.isError) return <QueryErrorState error={data.error} onRetry={() => void data.refetch()} />;
  if (!data.data) return <RestaurantSkeleton tiles={3} />;
  const page = data.data;
  const names = new Map((franchisees.data ?? []).map((f) => [f.id, f.name]));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open prospects</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {page.prospects.filter((p) => p.stage !== "signed" && p.stage !== "lost").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opening in 90 days</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{page.planned.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Openings at risk</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{page.atRisk.length}</p>
        </div>
      </div>
      <FormError message={error} />
      {page.due.length ? (
        <Panel title="Next steps due">
          <ul className="divide-y divide-border">
            {page.due.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 px-4 py-2 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">
                  {p.nextStep} · {p.nextStepOn}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Prospects" count={String(page.prospects.length)}>
        <div className="flex flex-wrap items-end gap-2 p-4">
          <Input aria-label="Prospect name" placeholder="Name" value={prospect.name} onChange={(e) => setProspect({ ...prospect, name: e.target.value })} className="h-9 w-44" />
          <Input aria-label="Market" placeholder="Market they want" value={prospect.market} onChange={(e) => setProspect({ ...prospect, market: e.target.value })} className="h-9 w-40" />
          <Input aria-label="Email" placeholder="Email" value={prospect.email} onChange={(e) => setProspect({ ...prospect, email: e.target.value })} className="h-9 w-44" />
          <Input aria-label="Phone" placeholder="Phone" value={prospect.phone} onChange={(e) => setProspect({ ...prospect, phone: e.target.value })} className="h-9 w-32" />
          <Input aria-label="Next step" placeholder="Next step" value={prospect.nextStep} onChange={(e) => setProspect({ ...prospect, nextStep: e.target.value })} className="h-9 w-40" />
          <Input aria-label="Next step on" type="date" value={prospect.nextStepOn} onChange={(e) => setProspect({ ...prospect, nextStepOn: e.target.value })} className="h-9 w-[160px]" />
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy || !prospect.name.trim() || !prospect.market.trim()}
            onClick={() =>
              void run(async () => {
                await addProspect({
                  name: prospect.name.trim(),
                  market: prospect.market.trim(),
                  email: prospect.email.trim() || null,
                  phone: prospect.phone.trim() || null,
                  nextStep: prospect.nextStep.trim() || null,
                  nextStepOn: prospect.nextStepOn || null,
                });
                setProspect({ name: "", market: "", email: "", phone: "", nextStep: "", nextStepOn: "" });
              })
            }
          >
            <Plus aria-hidden /> Add
          </RoleButton>
        </div>
        {page.prospects.length === 0 ? (
          <p className="border-t border-border p-4 text-sm text-muted-foreground">No prospects yet.</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {page.prospects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{p.market}</span>
                <Badge variant={p.stage === "signed" ? "default" : "secondary"}>{PROSPECT_LABELS[p.stage]}</Badge>
                <span className="ml-auto flex flex-wrap gap-2">
                  {movableProspectStages(p.stage).length ? (
                    <select
                      aria-label={`Move ${p.name}`}
                      className={SELECT}
                      value=""
                      onChange={(e) => e.target.value && void run(() => updateProspect(p.id, { stage: e.target.value as ProspectStage }))}
                    >
                      <option value="">Move to…</option>
                      {movableProspectStages(p.stage).map((s) => (
                        <option key={s} value={s}>
                          {PROSPECT_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {p.stage !== "signed" && p.stage !== "lost" ? (
                    <RoleButton
                      need={["network.manage"]}
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setSigning(p)}
                    >
                      <PenLine aria-hidden /> Sign
                    </RoleButton>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="New-store openings" count={String(page.openings.length)}>
        <div className="flex flex-wrap items-end gap-2 p-4">
          <select aria-label="Franchisee" className={SELECT} value={opening.franchiseeId || ""} onChange={(e) => setOpening({ ...opening, franchiseeId: Number(e.target.value) })}>
            <option value="">Franchisee</option>
            {(franchisees.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <Input aria-label="Store name" placeholder="Store name" value={opening.name} onChange={(e) => setOpening({ ...opening, name: e.target.value })} className="h-9 w-40" />
          <Input aria-label="City" placeholder="City" value={opening.city} onChange={(e) => setOpening({ ...opening, city: e.target.value })} className="h-9 w-32" />
          <Input aria-label="Target opening" type="date" value={opening.targetOpenOn} onChange={(e) => setOpening({ ...opening, targetOpenOn: e.target.value })} className="h-9 w-[160px]" />
          <RoleButton
            need={["network.manage"]}
            size="sm"
            disabled={busy || !opening.franchiseeId || !opening.name.trim()}
            onClick={() =>
              void run(async () => {
                await addOpening({
                  franchiseeId: opening.franchiseeId,
                  prospectId: null,
                  name: opening.name.trim(),
                  city: opening.city.trim() || null,
                  targetOpenOn: opening.targetOpenOn || null,
                });
                setOpening({ franchiseeId: 0, name: "", city: "", targetOpenOn: "" });
              })
            }
          >
            <Building2 aria-hidden /> Add
          </RoleButton>
        </div>
        {page.openings.length === 0 ? (
          <EmptyPanel title="No openings planned" body="Add a store a franchisee is opening to follow it from site search to opening day." />
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {page.openings.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span className="font-medium">{o.name}</span>
                <span className="text-muted-foreground">
                  {o.city ?? ""} · {names.get(o.franchiseeId) ?? "Franchisee"}
                  {o.targetOpenOn ? ` · target ${o.targetOpenOn}` : ""}
                </span>
                <Badge variant={o.stage === "open" ? "default" : "secondary"}>{OPENING_LABELS[o.stage]}</Badge>
                {o.atRisk ? <Badge variant="destructive">At risk</Badge> : null}
                <span className="ml-auto flex flex-wrap gap-2">
                  {movableOpeningStages(o.stage).length ? (
                    <select
                      aria-label={`Move ${o.name}`}
                      className={SELECT}
                      value=""
                      onChange={(e) => e.target.value && void run(() => updateOpening(o.id, { stage: e.target.value as OpeningStage }))}
                    >
                      <option value="">Move to…</option>
                      {movableOpeningStages(o.stage).map((s) => (
                        <option key={s} value={s}>
                          {OPENING_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {o.stage !== "open" && o.stage !== "dropped" ? (
                    <RoleButton
                      need={["network.manage"]}
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setToOpen(o)}
                    >
                      <Store aria-hidden /> Open
                    </RoleButton>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {signing ? (
        <FieldDialog
          title={`Sign ${signing.name}`}
          description="Signing creates the franchisee in the network with these rates, which are shares of net sales. A signed prospect is final."
          fields={[
            { key: "royalty", label: "Royalty %", defaultValue: "6", inputMode: "decimal" },
            { key: "fund", label: "Ad fund %", defaultValue: "4", inputMode: "decimal" },
          ]}
          confirmLabel="Sign"
          parse={(v) => {
            const royalty = parsePercentRate(v.royalty ?? "", "royalty");
            if (!royalty.ok) return royalty;
            const fund = parsePercentRate(v.fund ?? "", "ad fund");
            if (!fund.ok) return fund;
            return { ok: true, value: { royalty: royalty.value, fund: fund.value } };
          }}
          save={async ({ royalty, fund }) => {
            await signProspect(signing.id, royalty, fund);
            await refresh();
          }}
          onClose={() => setSigning(null)}
        />
      ) : null}
      {toOpen ? (
        <FieldDialog
          title={`Open ${toOpen.name}`}
          description="Opening creates the branch, open, under its franchisee. Give it the store number it will trade under; an open store is final."
          fields={[{ key: "code", label: "Store number", defaultValue: "", placeholder: "e.g. 301" }]}
          confirmLabel="Open the store"
          parse={(v) => parseStoreCode(v.code ?? "")}
          save={async (code) => {
            await openStore(toOpen.id, code);
            await refresh();
          }}
          onClose={() => setToOpen(null)}
        />
      ) : null}
    </div>
  );
}

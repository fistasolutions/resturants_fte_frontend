"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormError } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { setMemberScope } from "@/services/restaurant-actions";
import type { NetworkMember } from "@/types/restaurant";

const WHOLE = "whole";

/** Choose what a member sees: the whole network, one franchisee, or some of its branches. */
export function ScopeDialog({ member, onOpenChange }: { member: NetworkMember; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const franchisees = useApiQuery(restaurantQueries.franchisees());
  const [franchisee, setFranchisee] = useState(member.franchiseeId != null ? String(member.franchiseeId) : WHOLE);
  const [some, setSome] = useState(member.branchIds != null);
  const [picked, setPicked] = useState<Set<number>>(new Set(member.branchIds ?? []));
  const franchiseeId = franchisee === WHOLE ? null : Number(franchisee);
  const branches = useApiQuery(franchiseeId == null ? null : restaurantQueries.branches({ franchiseeId }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: number, on: boolean) =>
    setPicked((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await setMemberScope(member.membershipId, franchiseeId, franchiseeId != null && some ? [...picked] : null);
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Changing the access failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>What {member.name} sees</DialogTitle>
          <DialogDescription>
            Their role decides what they can do; this decides which branches they do it for. Figures, lists and
            royalties follow it everywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Access</Label>
            <Select
              value={franchisee}
              onValueChange={(value) => {
                setFranchisee(value);
                setSome(false);
                setPicked(new Set());
              }}
            >
              <SelectTrigger aria-label="Access">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WHOLE}>The whole network (head office)</SelectItem>
                {(franchisees.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {franchiseeId != null ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={some} onCheckedChange={(v) => setSome(v === true)} />
                Only some of its branches
              </label>
              {some ? (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                  {(branches.data ?? []).map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={picked.has(b.id)} onCheckedChange={(v) => toggle(b.id, v === true)} />
                      <span className="tabular-nums text-muted-foreground">#{b.code}</span> {b.name}
                    </label>
                  ))}
                  {branches.data?.length === 0 ? <p className="text-xs text-muted-foreground">This franchisee has no branches yet.</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <FormError message={error} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <RoleButton need={["network.manage"]} disabled={busy || (some && picked.size === 0)} onClick={() => void save()}>
            {busy ? "Saving…" : "Save access"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

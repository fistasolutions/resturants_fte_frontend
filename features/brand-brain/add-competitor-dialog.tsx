"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompetitorRun } from "@/features/brand-brain/competitor-run-provider";
import { addCompetitor } from "@/services/brand-brain-actions";

/**
 * Add a competitor by hand (SPEC-283): a name and a website — the agent reads the
 * site the same way Find does, and the profile waits in To review. The run shows
 * in the top-right toast like any other.
 */
export function AddCompetitorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { follow } = useCompetitorRun();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = name.trim().length > 0 && website.trim().length > 3;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await addCompetitor({ name: name.trim(), website: website.trim(), note: note.trim() || undefined });
      if (created.run) follow(created.run);
      void queryClient.invalidateQueries({ queryKey: ["brand-brain"] });
      setName("");
      setWebsite("");
      setNote("");
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add a competitor</DialogTitle>
            <DialogDescription>
              Name it and give its website. The agent reads the site the same way — categories, price band, shipping, returns, what it covers — and the profile waits for your approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="competitor-name">Name</Label>
              <Input id="competitor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Junee" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competitor-website">Website</Label>
              <Input id="competitor-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://junee.com" inputMode="url" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="competitor-note">Why they compete (optional, in your words)</Label>
              <Input id="competitor-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Same shoppers in our city; they undercut on price" />
            </div>
            {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <RoleButton need="brand_brain.manage" type="submit" disabled={!ready || busy}>
              {busy ? "Adding…" : "Read the site →"}
            </RoleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

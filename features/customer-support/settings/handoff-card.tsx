"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOPIC_ORDER, topicLabel } from "@/lib/customer-support";
import { can } from "@/lib/helpdesk-providers";
import type { HandoffTarget, SupportWorkspace, TopicKey } from "@/types/customer-support";

const DEFAULT = "__default";

/**
 * Settings → Hand-off map (SPEC-346): who receives each kind of ticket when the agent hands it
 * over. A topic left on the default goes to the Support team. Teams appear only where the
 * helpdesk can assign to teams.
 */
export function HandoffCard({ workspace, busy, onSave }: { workspace: SupportWorkspace; busy: boolean; onSave: (map: HandoffTarget[]) => void }) {
  const [map, setMap] = useState<Record<string, string>>(
    Object.fromEntries(workspace.handoffMap.map((h) => [h.topic, `${h.to.kind}:${h.to.name}`])),
  );
  const teams = can(workspace.provider, "assignTeams") ? workspace.teams : [];
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(
          Object.entries(map).map(([topic, key]) => {
            const [kind, ...rest] = key.split(":");
            return { topic: topic as TopicKey, to: { kind: kind === "team" ? "team" : "person", name: rest.join(":") } };
          }),
        );
      }}
    >
      <ul className="grid gap-2 md:grid-cols-2">
        {TOPIC_ORDER.filter((topic) => topic !== "spam").map((topic) => (
          <li key={topic} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{topicLabel(topic)}</span>
            <Select
              value={map[topic] ?? DEFAULT}
              onValueChange={(value) =>
                setMap((current) => {
                  const next = { ...current };
                  if (value === DEFAULT) delete next[topic];
                  else next[topic] = value;
                  return next;
                })
              }
            >
              <SelectTrigger className="h-8 w-52 text-xs" aria-label={`Hand off ${topicLabel(topic)} to`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT}>Default — Support</SelectItem>
                {teams.length ? (
                  <SelectGroup>
                    <SelectLabel>Teams</SelectLabel>
                    {teams.map((team) => (
                      <SelectItem key={team} value={`team:${team}`}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
                <SelectGroup>
                  <SelectLabel>People</SelectLabel>
                  {workspace.people.map((person) => (
                    <SelectItem key={person} value={`person:${person}`}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </li>
        ))}
      </ul>
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? "Saving…" : "Save hand-off map"}
      </Button>
    </form>
  );
}

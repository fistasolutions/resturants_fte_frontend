"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectGlyph } from "@/features/chat/project-glyph";
import { PROJECT_NAME_MAX, cleanProjectName } from "@/lib/chat-rail";
import {
  DEFAULT_COLOR,
  DEFAULT_ICON,
  PROJECT_COLORS,
  PROJECT_ICONS,
  colorBg,
  colorText,
} from "@/lib/project-style";
import { cn } from "@/lib/utils";
import type { ChatProjectStyle } from "@/types/chat";

export interface ProjectDialogValue extends ChatProjectStyle {
  name: string;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rename / restyle when given, create otherwise. */
  initial?: ProjectDialogValue;
  /** Resolves when saved; rejects with the message to show (a duplicate name). */
  onSubmit: (value: ProjectDialogValue) => Promise<void>;
}

/**
 * Create / edit a chat project (SPEC-249, SPEC-255): a name, a colour, an icon.
 * Enter submits, the button waits for a valid name, the server's objection shows
 * inline. The form mounts with the dialog, so every open starts clean.
 */
export function ProjectDialog({ open, onOpenChange, initial, onSubmit }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ProjectForm initial={initial} onSubmit={onSubmit} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: ProjectDialogValue;
  onSubmit: (value: ProjectDialogValue) => Promise<void>;
  onClose: () => void;
}) {
  const editing = initial !== undefined;
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [icon, setIcon] = useState(initial?.icon ?? DEFAULT_ICON);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cleaned = cleanProjectName(name);
  const unchanged =
    editing && cleaned === initial.name && color === initial.color && icon === initial.icon;
  const canSave = cleaned !== null && !unchanged && !saving;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || cleaned === null) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: cleaned, color, icon });
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Saving the project failed.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ProjectGlyph icon={icon} color={color} className="size-5" />
          {editing ? "Edit project" : "New project"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? "The chats inside keep their place."
            : "A project groups the chats about one supplier, one season, one problem."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Supplier X, Autumn drop, Returns clean-up…"
          maxLength={PROJECT_NAME_MAX + 20}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby="project-name-hint"
        />
        <p id="project-name-hint" className="text-xs text-muted-foreground">
          {error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            `${cleaned?.length ?? 0} / ${PROJECT_NAME_MAX}`
          )}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Colour</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project colour">
          {PROJECT_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={color === option}
              aria-label={option}
              title={option}
              onClick={() => setColor(option)}
              data-color={option}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                colorBg(option),
                color === option ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110",
              )}
            >
              {color === option && <Check className="size-3.5 text-background" aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Icon</legend>
        <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Project icon">
          {PROJECT_ICONS.map((option) => {
            const selected = icon === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={option}
                title={option}
                onClick={() => setIcon(option)}
                data-icon={option}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-lg border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? cn("border-foreground bg-accent", colorText(color))
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <ProjectGlyph
                  icon={option}
                  color={selected ? color : "slate"}
                  className={cn("size-4", !selected && "text-muted-foreground")}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSave}>
          {saving ? "Saving…" : editing ? "Save" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

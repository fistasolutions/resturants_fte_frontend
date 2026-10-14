/**
 * How a chat project looks (SPEC-255): its colour and icon. The two lists mirror
 * the backend's `PROJECT_COLORS` / `PROJECT_ICONS` (SPEC-258) — a test pins them.
 * Colours are the `--label-*` tokens in `globals.css`, exposed as `bg-label-*` /
 * `text-label-*`; they carry no status meaning.
 */
import {
  BarChart3,
  Box,
  Calendar,
  Flame,
  Folder,
  Megaphone,
  Receipt,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export const PROJECT_COLORS = [
  "slate",
  "violet",
  "blue",
  "teal",
  "green",
  "amber",
  "rose",
  "orange",
] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const PROJECT_ICONS = [
  "folder",
  "tag",
  "bag",
  "truck",
  "users",
  "chart",
  "calendar",
  "flame",
  "star",
  "box",
  "receipt",
  "megaphone",
] as const;
export type ProjectIcon = (typeof PROJECT_ICONS)[number];

export const DEFAULT_COLOR: ProjectColor = "slate";
export const DEFAULT_ICON: ProjectIcon = "folder";

/** Full class names, written out so Tailwind can see them. */
const TEXT: Record<ProjectColor, string> = {
  slate: "text-label-slate",
  violet: "text-label-violet",
  blue: "text-label-blue",
  teal: "text-label-teal",
  green: "text-label-green",
  amber: "text-label-amber",
  rose: "text-label-rose",
  orange: "text-label-orange",
};
const BG: Record<ProjectColor, string> = {
  slate: "bg-label-slate",
  violet: "bg-label-violet",
  blue: "bg-label-blue",
  teal: "bg-label-teal",
  green: "bg-label-green",
  amber: "bg-label-amber",
  rose: "bg-label-rose",
  orange: "bg-label-orange",
};
/** The current project's row wash — the colour at 15 %, written out for Tailwind. */
const TINT: Record<ProjectColor, string> = {
  slate: "bg-label-slate/15",
  violet: "bg-label-violet/15",
  blue: "bg-label-blue/15",
  teal: "bg-label-teal/15",
  green: "bg-label-green/15",
  amber: "bg-label-amber/15",
  rose: "bg-label-rose/15",
  orange: "bg-label-orange/15",
};
const ICONS: Record<ProjectIcon, LucideIcon> = {
  folder: Folder,
  tag: Tag,
  bag: ShoppingBag,
  truck: Truck,
  users: Users,
  chart: BarChart3,
  calendar: Calendar,
  flame: Flame,
  star: Star,
  box: Box,
  receipt: Receipt,
  megaphone: Megaphone,
};

export function isProjectColor(value: string | null | undefined): value is ProjectColor {
  return (PROJECT_COLORS as readonly string[]).includes(value ?? "");
}

export function isProjectIcon(value: string | null | undefined): value is ProjectIcon {
  return (PROJECT_ICONS as readonly string[]).includes(value ?? "");
}

/** `text-label-*` for the icon; an unknown value falls back to slate. */
export function colorText(color: string | null | undefined): string {
  return TEXT[isProjectColor(color) ? color : DEFAULT_COLOR];
}

/** `bg-label-*` for the dot. */
export function colorBg(color: string | null | undefined): string {
  return BG[isProjectColor(color) ? color : DEFAULT_COLOR];
}

/** The 15 % wash (`bg-label-…/15`) for the row of the project the owner is in (SPEC-255 Patches). */
export function colorTint(color: string | null | undefined): string {
  return TINT[isProjectColor(color) ? color : DEFAULT_COLOR];
}

export function projectIcon(icon: string | null | undefined): LucideIcon {
  return ICONS[isProjectIcon(icon) ? icon : DEFAULT_ICON];
}

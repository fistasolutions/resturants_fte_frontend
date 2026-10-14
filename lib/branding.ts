/**
 * Branding (SPEC-317 over backend SPEC-318) — pure: the Settings view model, the checks a file
 * must pass before it is sent (the backend checks again, by content), and the carousel order.
 */
import { toBrandColor, type BrandColor } from "@/lib/brand-color";
import { viaProxy, type BrandingAsset, type PublicBranding } from "@/lib/login-media";

export type LogoVariant = "light" | "dark";
export type LoginKind = "image" | "video" | "carousel";

const MB = 1024 * 1024;
export const LOGO_MAX_BYTES = 2 * MB;
export const IMAGE_MAX_BYTES = 10 * MB;
export const VIDEO_MAX_BYTES = 25 * MB;
export const CAROUSEL_MIN = 2;
export const CAROUSEL_MAX = 6;

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
/** For `<input accept>`. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_TYPES.join(",");

export interface BrandingMedia {
  url: string;
  mediaType: string;
}

export interface Branding {
  /** The organization's short name — its login link is `/login?org=<slug>`. */
  slug: string;
  logo: Record<LogoVariant, string | null>;
  login: {
    kind: LoginKind | "none";
    items: BrandingMedia[];
    poster: string | null;
  };
  /** The brand colour (SPEC-322), or null for the platform's own. */
  color: BrandColor | null;
}

function media(asset: BrandingAsset | null | undefined): BrandingMedia | null {
  const url = viaProxy(asset?.url);
  return url && asset ? { url, mediaType: asset.media_type } : null;
}

export function toBranding(api: PublicBranding): Branding {
  const items = (api.login?.items ?? [])
    .map(media)
    .filter((m): m is BrandingMedia => m !== null);
  const kind = api.login?.kind ?? "none";
  return {
    slug: api.slug ?? "",
    logo: {
      light: viaProxy(api.logo?.light?.url),
      dark: viaProxy(api.logo?.dark?.url),
    },
    login: {
      kind: items.length === 0 ? "none" : kind,
      items,
      poster: viaProxy(api.login?.poster?.url),
    },
    color: toBrandColor(api.color),
  };
}

/** The minimum a file check needs — a browser `File` satisfies it. */
export interface FileLike {
  name: string;
  type: string;
  size: number;
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / MB)} MB`;
}

function isImage(file: FileLike): boolean {
  return (IMAGE_TYPES as readonly string[]).includes(file.type);
}

function isVideo(file: FileLike): boolean {
  return (VIDEO_TYPES as readonly string[]).includes(file.type);
}

/** The first problem with a logo, in words, or null when it may be sent. */
export function checkLogo(file: FileLike): string | null {
  if (!isImage(file)) return `${file.name} isn't a PNG, JPEG or WebP image.`;
  if (file.size > LOGO_MAX_BYTES) return `${file.name} is larger than ${megabytes(LOGO_MAX_BYTES)}.`;
  return null;
}

function checkImage(file: FileLike): string | null {
  if (!isImage(file)) return `${file.name} isn't a JPEG, PNG or WebP image.`;
  if (file.size > IMAGE_MAX_BYTES) return `${file.name} is larger than ${megabytes(IMAGE_MAX_BYTES)}.`;
  return null;
}

/** The first problem with a login-screen choice, in words, or null when it may be sent. */
export function checkLoginMedia(
  kind: LoginKind,
  files: readonly FileLike[],
  poster: FileLike | null = null,
): string | null {
  if (kind === "image") {
    if (files.length !== 1) return "Choose one picture.";
    return checkImage(files[0]);
  }
  if (kind === "video") {
    if (files.length !== 1) return "Choose one video.";
    const video = files[0];
    if (!isVideo(video)) return `${video.name} isn't an MP4 or WebM video.`;
    if (video.size > VIDEO_MAX_BYTES) return `${video.name} is larger than ${megabytes(VIDEO_MAX_BYTES)}.`;
    return poster ? checkImage(poster) : null;
  }
  if (files.length < CAROUSEL_MIN || files.length > CAROUSEL_MAX) {
    return `A carousel has ${CAROUSEL_MIN} to ${CAROUSEL_MAX} pictures — you have ${files.length}.`;
  }
  for (const file of files) {
    const problem = checkImage(file);
    if (problem) return problem;
  }
  return null;
}

/** Move one item a step earlier (-1) or later (+1); out-of-range moves change nothing. */
export function moveItem<T>(list: readonly T[], index: number, step: -1 | 1): T[] {
  const target = index + step;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeItem<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/** Which logo each theme shows: its own, else the other one, else null (the platform mark). */
export function sidebarLogos(
  light: string | null,
  dark: string | null,
): { light: string | null; dark: string | null } {
  return { light: light ?? dark, dark: dark ?? light };
}

export const LOGIN_KIND_LABELS: Record<LoginKind, string> = {
  image: "Image",
  video: "Video",
  carousel: "Carousel",
};

/** The team's own login link (SPEC-317 Patches): the login screen with the organization's
 * branding. Without an origin (a server render) it is the path alone. */
export function loginLink(slug: string, origin = ""): string {
  const path = `/login?org=${encodeURIComponent(slug)}`;
  return `${origin.replace(/\/+$/, "")}${path}`;
}

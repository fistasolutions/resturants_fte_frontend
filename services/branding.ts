/**
 * Branding writes (SPEC-317) — multipart uploads through the proxy, throwing the shared
 * `ApiError` so a view shows the backend's own words (`unsupported_media`, `media_too_large`,
 * `login_media_invalid`, `color_invalid`). The reads live in `lib/queries/branding.ts`.
 */
import { apiErrorFromResponse } from "@/lib/api-error";
import type { BrandColorSource } from "@/lib/brand-color";
import { toBranding, type Branding, type LoginKind, type LogoVariant } from "@/lib/branding";
import { proxyUrl } from "@/lib/client-api";
import type { PublicBranding } from "@/lib/login-media";

const BASE = "/organizations/current/branding";

async function send(
  path: string,
  method: "PUT" | "DELETE",
  body?: FormData | string,
): Promise<Branding> {
  const headers = typeof body === "string" ? { "Content-Type": "application/json" } : undefined;
  const response = await fetch(proxyUrl(`${BASE}${path}`), { method, body, headers });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return toBranding((await response.json()) as PublicBranding);
}

export async function uploadLogo(variant: LogoVariant, file: File): Promise<Branding> {
  const form = new FormData();
  form.append("file", file);
  return send(`/logo/${variant}`, "PUT", form);
}

export async function removeLogo(variant: LogoVariant): Promise<Branding> {
  return send(`/logo/${variant}`, "DELETE");
}

/** Replaces the login screen: one image, one video (+ poster), or 2–6 images in order. */
export async function setLoginMedia(
  kind: LoginKind,
  files: File[],
  poster: File | null = null,
): Promise<Branding> {
  const form = new FormData();
  form.append("kind", kind);
  for (const file of files) form.append("files", file);
  if (poster) form.append("poster", poster);
  return send("/login-media", "PUT", form);
}

export async function clearLoginMedia(): Promise<Branding> {
  return send("/login-media", "DELETE");
}

/** Sets the brand colour (SPEC-322 over backend SPEC-323); the hex is `#rrggbb`. */
export async function setBrandColor(hex: string, source: BrandColorSource): Promise<Branding> {
  return send("/color", "PUT", JSON.stringify({ hex, source }));
}

/** Back to the platform's own colours. */
export async function clearBrandColor(): Promise<Branding> {
  return send("/color", "DELETE");
}

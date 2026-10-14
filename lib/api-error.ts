/**
 * The one error shape every API transport throws (SPEC-017, split out in SPEC-230).
 *
 * Lives in its own module — with no `server-only` import — so that both `serverApi`
 * (Server Components) and `clientApi` (`"use client"` code via `/api/proxy`) can throw
 * the same class, and a view can narrow on `instanceof ApiError` regardless of which
 * transport produced the failure. `lib/api.ts` re-exports it, so existing
 * `import { ApiError } from "@/lib/api"` call sites are untouched.
 */
import { isSupportBlocked, SUPPORT_BLOCKED_EVENT } from "@/lib/support-session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * SPEC-363: in a support session the backend refuses a send with 423 `support_session_blocked`.
 * Every client transport turns failures into `ApiError` here, so this is the one place that
 * tells the support banner to show its "Nothing was sent" warning — whatever screen made the call.
 */
function announceSupportBlock(status: number, code: string | undefined, message: string | undefined) {
  if (typeof window === "undefined" || !isSupportBlocked(status, code ?? "")) return;
  window.dispatchEvent(new CustomEvent(SUPPORT_BLOCKED_EVENT, { detail: { message } }));
}

/** The backend's error envelope: `{ error: { code, message } }` on every non-2xx. */
interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

/**
 * Build an `ApiError` from a failed `Response`, reading the backend envelope when it is
 * present and falling back to a status-only message when it is not (a proxy 502, an
 * HTML error page). Shared by both transports so their errors are byte-identical.
 */
export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const error = body?.error ?? {};
  announceSupportBlock(response.status, error.code, error.message);
  return new ApiError(
    response.status,
    error.code ?? "api_error",
    error.message ?? `API request failed (${response.status}).`,
  );
}

/** True for a backend 404 — the signal a detail view turns into `notFound()`. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

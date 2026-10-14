"use client";

import { type ErrorBoundaryProps, supportReference } from "@/lib/error-boundary";

/**
 * The last resort (SPEC-227): the root layout itself failed.
 *
 * `global-error` REPLACES `app/layout.tsx`, so it must render its own `<html>` and
 * `<body>` — and it inherits nothing from the app: no font class, no theme
 * provider, and no guarantee that `globals.css` loaded at all. Root Rule 9's
 * "semantic tokens only" cannot apply to a document rendered without the sheet
 * that defines them, so this one file is styled inline and carries its own
 * light/dark rules via `prefers-color-scheme`. That is the exception the rule
 * exists to survive, not a shortcut around it.
 *
 * It is deliberately plain: nothing here may depend on anything that could be the
 * thing that broke.
 */
export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: ErrorBoundaryProps) {
  const retry = unstable_retry ?? reset;
  const reference = supportReference(error);

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <style>{`
          .ge-root {
            min-height: 100svh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            background: #ffffff;
            color: #0b0b0c;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          }
          .ge-card {
            max-width: 32rem;
            text-align: center;
            border: 1px solid rgba(228, 40, 40, 0.25);
            background: rgba(228, 40, 40, 0.05);
            border-radius: 16px;
            padding: 2rem;
          }
          .ge-title { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
          .ge-body { font-size: 0.875rem; line-height: 1.6; margin: 0; opacity: 0.75; }
          .ge-actions { margin-top: 1.25rem; }
          .ge-button {
            font: inherit;
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 10px;
            border: 1px solid transparent;
            background: #0b0b0c;
            color: #ffffff;
            cursor: pointer;
          }
          .ge-button:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
          .ge-ref { margin-top: 1rem; font-size: 0.75rem; opacity: 0.6; }
          .ge-ref code {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            padding: 0.1rem 0.35rem;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.06);
          }
          @media (prefers-color-scheme: dark) {
            .ge-root { background: #0b0b0c; color: #f4f4f5; }
            .ge-button { background: #f4f4f5; color: #0b0b0c; }
            .ge-ref code { background: rgba(255, 255, 255, 0.1); }
          }
        `}</style>
        <div className="ge-root">
          <div className="ge-card" role="alert">
            <h1 className="ge-title">Something went wrong</h1>
            <p className="ge-body">
              The application failed to start. Nothing has been changed or lost.
              Reloading usually clears it — if it does not, the API may be
              restarting.
            </p>
            {retry && (
              <div className="ge-actions">
                <button type="button" className="ge-button" onClick={() => retry()}>
                  Try again
                </button>
              </div>
            )}
            {reference && (
              <p className="ge-ref">
                Reference <code>{reference}</code>
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

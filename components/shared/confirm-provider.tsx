"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConfirmCopy } from "@/lib/confirm";
import { cn } from "@/lib/utils";

type Ask = (copy: Partial<ConfirmCopy> & Pick<ConfirmCopy, "title">) => Promise<boolean>;

const ConfirmContext = createContext<Ask | null>(null);

interface Pending extends ConfirmCopy {
  resolve: (answer: boolean) => void;
}

/**
 * One confirmation dialog for the whole app (SPEC-304).
 *
 * `window.confirm` renders the operating system's box — wrong typeface, no theme, and it
 * says the hostname out loud ("localhost:3000 says"). This is the same question in the
 * app's own voice, and it answers with a promise so a call site changes by one `await`.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const ask = useCallback<Ask>(
    (copy) =>
      new Promise<boolean>((resolve) => {
        setPending({
          title: copy.title,
          body: copy.body ?? "",
          confirmLabel: copy.confirmLabel ?? "Confirm",
          destructive: copy.destructive ?? true,
          resolve,
        });
      }),
    [],
  );

  function settle(answer: boolean) {
    pending?.resolve(answer);
    setPending(null);
  }

  const value = useMemo(() => ask, [ask]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog open={pending !== null} onOpenChange={(open) => (open ? null : settle(false))}>
        <AlertDialogContent data-confirm-dialog>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
            {pending?.body ? (
              <AlertDialogDescription>{pending.body}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => settle(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-confirm-accept
              className={cn(
                pending?.destructive &&
                  "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
              )}
              onClick={() => settle(true)}
            >
              {pending?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** Ask the owner, in the app's own dialog. Resolves false when dismissed. */
export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext);
  if (ask === null) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ask;
}

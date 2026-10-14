"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logout } from "@/services/auth";

interface LogoutDialogProps {
  /** The element that opens the confirmation (rendered via asChild). */
  trigger: React.ReactNode;
}

/** Confirmation gate before signing out — shared by the sidebar and Settings. */
export function LogoutDialog({ trigger }: LogoutDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleLogout(event: React.MouseEvent<HTMLButtonElement>) {
    // Keep the dialog open until the cookies are actually gone — navigating
    // before DELETE /api/session lands makes the proxy gate bounce the
    // still-cookied user straight back into the app (SPEC-017 Patches).
    event.preventDefault();
    setPending(true);
    try {
      await logout();
    } finally {
      // Hard navigation: re-runs the proxy gate with cleared cookies and
      // drops the client router cache, so no app page lingers after logout.
      window.location.assign("/login");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll be signed out on this device. Your store data stays
            synced and will be here when you sign back in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? "Logging out…" : "Log out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/form-alert";
import { ApiError } from "@/lib/api-error";
import { restoreFailureMessage } from "@/lib/organization-lifecycle";
import { restoreOrganization } from "@/services/settings-actions";

type State = "ready" | "restoring" | "restored" | "failed";

/** One button: undo the deletion (SPEC-332 over backend SPEC-340 Part C). */
export function RestoreView({ token }: { token: string | null }) {
  const [state, setState] = useState<State>(token ? "ready" : "failed");
  const [message, setMessage] = useState<string>(restoreFailureMessage("restore_expired"));

  async function restore() {
    if (!token) return;
    setState("restoring");
    try {
      await restoreOrganization(token);
      setState("restored");
    } catch (failure) {
      setMessage(restoreFailureMessage(failure instanceof ApiError ? failure.code : null));
      setState("failed");
    }
  }

  if (state === "restored") {
    return (
      <div className="space-y-4">
        <FormAlert
          tone="note"
          message="Restored. Sign in, then choose a plan — the old one was cancelled when deletion was asked for."
        />
        <Button asChild className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }
  if (state === "failed") {
    return (
      <div className="space-y-4">
        <FormAlert tone="error" message={message} />
        <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }
  return (
    <Button className="w-full" onClick={() => void restore()} disabled={state === "restoring"}>
      {state === "restoring" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      Restore organization
    </Button>
  );
}

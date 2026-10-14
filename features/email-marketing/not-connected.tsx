import { Plug } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { emailTabHref } from "@/lib/email-marketing";

/** Shown on every tab while no email platform is connected (SPEC-345) — one way forward. */
export function NotConnected({ what }: { what: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground" aria-hidden>
        <Plug className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">Connect your email platform</h2>
      <p className="text-sm text-muted-foreground">
        {what} comes from your email platform. Connect Klaviyo in Settings and the Email Marketing Manager reads your
        lists, flows and campaigns — it changes nothing until you approve it.
      </p>
      <ShallowLink href={emailTabHref("settings")} className={buttonVariants()}>
        Go to Settings → Connection
      </ShallowLink>
    </div>
  );
}

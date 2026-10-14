"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHydrated } from "@/hooks/use-hydrated";
import { loginLink } from "@/lib/branding";

/**
 * "Your team's login link" (SPEC-317 Patches): the address that opens the login screen with
 * this organization's logo and picture, with Copy and Open. The server render shows the path;
 * the browser adds its own address once hydrated, so the two never disagree.
 */
export function LoginLinkCard({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const link = loginLink(slug, hydrated ? window.location.origin : "");

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }

  if (!slug) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your team&apos;s login link</CardTitle>
        <CardDescription>
          Share it with your team or bookmark it: it opens the login screen with your logo and
          picture. The plain login page shows them only on a browser that has signed in here before.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm">
            {link}
          </code>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void copy()} aria-live="polite">
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={loginLink(slug)} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                Open
              </a>
            </Button>
          </div>
        </div>
        {failed ? (
          <p role="alert" className="text-sm text-destructive">
            Your browser blocked copying — select the link and copy it by hand.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

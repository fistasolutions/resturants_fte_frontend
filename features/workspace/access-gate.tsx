"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  accessFor,
  tabLockAccess,
  type Access,
  type AccessAction,
  type WorkspaceNavigation,
} from "@/lib/disclosure";
import { rememberReturn } from "@/features/workspace/setup-return";
import { pageName } from "@/lib/disclosure";
import { pageKey } from "@/lib/first-sync";
import { tabAccess, type Visibility } from "@/lib/guided-view";

/**
 * A page the member cannot open answers with the reason (SPEC-315) — never an error or an
 * empty page. The guided view (SPEC-357) adds two answers: a bare page whose opening tab has no
 * data moves to its first tab with data, and a locked tab named in the URL says what unlocks it.
 * Everything else passes straight through.
 */
export function AccessGate({
  navigation,
  visibility,
  children,
}: {
  navigation: WorkspaceNavigation;
  visibility: Visibility | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const access = accessFor(pathname, navigation);
  const tab = access.allowed ? tabAccess(pathname, searchParams, visibility) : { kind: "open" as const };
  const redirectTo = tab.kind === "redirect" ? tab.href : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!access.allowed) {
    return <Locked access={access} back={{ label: "Go to your home page", href: "/" }} />;
  }
  // Nothing renders while the URL moves, so the locked tab never fetches.
  if (tab.kind === "redirect") return null;
  if (tab.kind === "locked") {
    const locked = tabLockAccess(tab.page, tab.tab, tab.lock, navigation);
    return <Locked access={locked} back={locked.back} />;
  }
  return <>{children}</>;
}

/** A connect button that remembers this page, so Setup brings the person back once the app has
 * synced (SPEC-361). */
function ConnectLink({ action, primary }: { action: AccessAction; primary: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const here = searchParams.size ? `${pathname}?${searchParams.toString()}` : pathname;
  return (
    <Button asChild variant={primary ? "default" : "outline"}>
      <Link
        href={action.href}
        onClick={() => {
          if (action.integration) {
            rememberReturn({
              key: action.integration,
              integration: action.integration,
              href: here,
              label: pageName(pageKey(pathname)),
            });
          }
        }}
      >
        {action.label}
      </Link>
    </Button>
  );
}

function Locked({ access, back }: { access: Access; back: AccessAction }) {
  const Icon = access.connect ? Plug : Lock;
  const action = access.action;
  const secondary = access.secondary ?? null;
  return (
    <main className="flex flex-1 items-center justify-center p-4 md:p-6">
      <div className="max-w-md space-y-4 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="font-heading text-2xl tracking-wide">{access.title}</h1>
        <p className="text-sm text-muted-foreground">{access.message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {action ? <ConnectLink action={action} primary /> : null}
          {secondary ? <ConnectLink action={secondary} primary={false} /> : null}
          <Button asChild variant="outline">
            <Link href={back.href}>{back.label}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

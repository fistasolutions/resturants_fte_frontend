import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { BrandTheme } from "@/components/shared/brand-theme";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FirstSyncGate } from "@/features/first-sync/first-sync-gate";
import { AccessGate } from "@/features/workspace/access-gate";
import { SetupChecklist } from "@/features/workspace/setup-checklist";
import { WorkspaceProvider } from "@/features/workspace/workspace-provider";
import { NavPrefsProvider } from "@/features/navigation/nav-prefs-provider";
import { FirstSyncProvider } from "@/features/first-sync/first-sync-provider";
import { FirstSyncToast } from "@/features/first-sync/first-sync-toast";
import { ChatDrawer } from "@/features/chat/chat-drawer";
import { ChatDrawerProvider } from "@/features/chat/chat-drawer-provider";
import { SupportBanner } from "@/features/support-session/support-banner";
import { ChatDrawerTrigger, ChatLauncher } from "@/features/chat/chat-launcher";
import { SelectionAsk } from "@/features/chat/selection-ask";
import { BrandResearchProvider } from "@/features/brand-brain/brand-research-provider";
import { BrandResearchToast } from "@/features/brand-brain/brand-research-toast";
import { CompetitorRunProvider } from "@/features/brand-brain/competitor-run-provider";
import { CompetitorRunToast } from "@/features/brand-brain/competitor-run-toast";
import { GenerationProvider } from "@/features/spotlight/generation-provider";
import { ConfirmProvider } from "@/components/shared/confirm-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { GenerationToast } from "@/features/spotlight/generation-toast";
import { ApiError } from "@/lib/api";
import { isSessionExpired } from "@/lib/error-boundary";
import { navPrefsCookie, parseHidden } from "@/lib/nav-prefs";
import { displayBrandName } from "@/lib/product";
import { getCurrentUser } from "@/services/store";
import { getWorkspace } from "@/services/workspace";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userResult, cookieStore, workspace] = await Promise.all([
    // SPEC-227: a rejected token must bounce to /login, not render an error page.
    //
    // `proxy.ts` refreshes silently when the access cookie is ABSENT, but it gates
    // on the cookie's presence alone — so a cookie that is still there while the
    // backend rejects the token inside it (secret rotated, token revoked, clock
    // skew) sails through the gate and 401s here instead. This layout runs on every
    // page load, so that throw lands on the root boundary, and because Next strips
    // a server error's message in production the boundary can only offer a generic
    // "Try again" — which re-runs the same rejected request forever.
    //
    // The boundary cannot fix that from the outside; the throw site can. Same
    // destination the proxy would have chosen, one redirect earlier.
    // Typed as Error so the union stays `UserProfile | Error` — a bare `unknown`
    // cannot be narrowed by the `instanceof` below, which is what broke the build.
    getCurrentUser().catch((error: unknown) => error as Error),
    cookies(),
    // SPEC-315/317: what this member may see and the organization's brand — one read,
    // beside the user, never after it.
    getWorkspace(),
  ]);

  if (userResult instanceof Error) {
    const unauthorized =
      (userResult instanceof ApiError && userResult.status === 401) ||
      isSessionExpired(userResult);
    // The marker matters: `proxy.ts` gates on the cookie's presence, so a bare
    // /login would be bounced straight back into the app and loop forever. This
    // tells the gate to clear the rejected pair on the way through.
    if (unauthorized) redirect("/login?session=expired");
    throw userResult;
  }
  // SPEC-342: a company with no store has nothing to show — every page would 409. Back to
  // the onboarding step it stopped at (plan or connect store), from the read above.
  if (workspace.needsStore) redirect("/onboarding");
  const user = userResult;
  // Persist the collapse choice across reloads (the sidebar writes this cookie).
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  // SPEC-338: what this member hid from their sidebar, read here so the first paint is right.
  const navPrefsName = navPrefsCookie(user.email);
  const hiddenNav = [...parseHidden(cookieStore.get(navPrefsName)?.value)];

  // SPEC-216: the generation provider wraps the whole app so the progress toast appears
  // on every page and survives a hard refresh — the run lives in a database row now
  // (backend SPEC-224), not in the page that started it.
  // SPEC-230: the session-long client data cache sits above the shell. This layout is
  // not re-rendered on client-side navigation, so the cache outlives every page.
  // SPEC-235: the Ask Glisp panel lives here for the same reason — its thread, draft
  // and any in-flight stream survive navigation. Two triggers, one panel: the
  // mobile header icon and the desktop launcher pill (there is no desktop top bar).
  return (
    <WorkspaceProvider workspace={workspace}>
    <NavPrefsProvider cookieName={navPrefsName} initialHidden={hiddenNav}>
    {/* SPEC-322: the organization's brand colour, from the workspace read above — no new request. */}
    <BrandTheme hex={workspace.brand.color} />
    <QueryProvider>
    <FirstSyncProvider>
    <ConfirmProvider>
    <GenerationProvider>
    <BrandResearchProvider>
    <CompetitorRunProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar
          user={user}
          navigation={workspace.navigation}
          visibility={workspace.visibility}
          brand={workspace.brand}
        />
        <SidebarInset>
        {/* SPEC-363: an operator's support session — draws only in that tab. */}
        <SupportBanner />
        <ChatDrawerProvider>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <span className="truncate text-sm font-semibold">{displayBrandName(workspace.brand.name)}</span>
          <ChatDrawerTrigger />
          <NotificationsBell />
        </header>
        {/* SPEC-314: a page waits for its data during the first sync, then opens by itself. */}
        {/* SPEC-360: what the company switched on that still needs an integration, top right. */}
        <SetupChecklist />
        <AccessGate navigation={workspace.navigation} visibility={workspace.visibility}>
          <FirstSyncGate>{children}</FirstSyncGate>
        </AccessGate>
        <ChatLauncher />
        <ChatDrawer />
        {/* SPEC-243: the "Ask Glisp" bubble over any text selection. */}
        <SelectionAsk />
        </ChatDrawerProvider>
        {/* SPEC-178 — the single host every media progress toast portals into.
            The Studio mounts one panel per draft, so two jobs can run at once;
            a per-panel `fixed` box put both in the same corner. One column,
            stacked, declared once here rather than created from JS. */}
        <div
          id="media-toast-host"
          className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 [&>*]:pointer-events-auto"
        />
        <GenerationToast />
        {/* SPEC-314: the store's first sync, live. */}
        <FirstSyncToast />
        {/* SPEC-341: the Brand Researcher's run, followed over SSE, until its review is opened. */}
        <BrandResearchToast />
        {/* SPEC-283: the competitor Find / read run, followed over SSE. */}
        <CompetitorRunToast />
      </SidebarInset>
      </SidebarProvider>
    </CompetitorRunProvider>
    </BrandResearchProvider>
    </GenerationProvider>
    </ConfirmProvider>
    </FirstSyncProvider>
    </QueryProvider>
    </NavPrefsProvider>
    </WorkspaceProvider>
  );
}

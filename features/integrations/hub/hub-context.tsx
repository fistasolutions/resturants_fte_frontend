"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ConnectDialog } from "@/features/integrations/hub/connect-dialog";
import { useCan } from "@/hooks/use-can";
import { ApiError } from "@/lib/api-error";
import type { IntegrationKey } from "@/lib/integration-catalog";
import { integrationQueries } from "@/lib/queries/integrations";
import type { Permission } from "@/lib/permissions";
import { financeQueries } from "@/lib/queries/finance";
import { QUICKBOOKS_INTEGRATION_PATH, returnCookie } from "@/lib/quickbooks-connection";
import { quickBooksAuthorizeUrl } from "@/services/finance-actions";
import { getGoogleAuthorizeUrl } from "@/services/google-actions";
import { syncIntegration } from "@/services/integration-hub-actions";
import { getMetaAuthorizeUrl } from "@/services/meta-actions";

export interface HubNotice {
  tone: "success" | "error";
  text: string;
}

interface HubContextValue {
  notice: HubNotice | null;
  say: (notice: HubNotice | null) => void;
  /** Open the connect dialog for an app. */
  connect: (key: IntegrationKey) => void;
  /** Send the owner to the provider's sign-in (Google, Meta, Intuit). */
  signIn: (key: IntegrationKey) => Promise<void>;
  syncNow: (key: IntegrationKey, name: string) => Promise<void>;
  /** Keys whose Sync now request is on its way. */
  starting: ReadonlySet<string>;
  /** Re-read the overview and every timeline after a change. */
  refresh: () => void;
}

const HubContext = createContext<HubContextValue | null>(null);

export function useHub(): HubContextValue {
  const value = useContext(HubContext);
  if (!value) throw new Error("useHub must be used inside <HubProvider>");
  return value;
}

/** What starting a provider sign-in needs (SPEC-358): QuickBooks is Finance's connection too. */
export function signInNeed(key: IntegrationKey): readonly Permission[] {
  return key === "quickbooks" ? ["finance.manage", "integrations.manage"] : ["integrations.manage"];
}

/** The provider's authorize URL, asked for at the moment of the click (its state expires). */
async function authorizeUrl(key: IntegrationKey): Promise<string> {
  if (key === "gsc") return getGoogleAuthorizeUrl();
  if (key === "meta") return getMetaAuthorizeUrl();
  if (key === "quickbooks") {
    // Intuit's callback returns to QuickBooks' own page in the hub (SPEC-328).
    document.cookie = returnCookie(QUICKBOOKS_INTEGRATION_PATH);
    return quickBooksAuthorizeUrl();
  }
  throw new Error("This app does not sign in with a provider.");
}

/**
 * What both hub pages share (SPEC-328): the connect dialog, Sync now, and one notice line.
 * A notice clears itself after a few seconds; an error stays until the next action.
 */
export function HubProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const can = useCan();
  const [notice, setNotice] = useState<HubNotice | null>(null);
  const [connecting, setConnecting] = useState<IntegrationKey | null>(null);
  const [starting, setStarting] = useState<ReadonlySet<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((next: HubNotice | null) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice(next);
    if (next?.tone === "success") timer.current = setTimeout(() => setNotice(null), 6000);
  }, []);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: integrationQueries.overview().queryKey });
    void queryClient.invalidateQueries({ queryKey: ["integrations", "activity"] });
    void queryClient.invalidateQueries({ queryKey: integrationQueries.settings().queryKey });
    void queryClient.invalidateQueries({ queryKey: financeQueries.connections().queryKey });
    void queryClient.invalidateQueries({ queryKey: ["ads", "platforms"] });
  }, [queryClient]);

  const syncNow = useCallback(
    async (key: IntegrationKey, name: string) => {
      // SPEC-358: every Sync now in the hub goes through here, so the role is checked once.
      const gate = can("integrations.manage");
      if (!gate.allowed) {
        say({ tone: "error", text: gate.reason ?? `Your role can't start the ${name} sync.` });
        return;
      }
      setStarting((prev) => new Set(prev).add(key));
      try {
        await syncIntegration(key);
        say({ tone: "success", text: `${name} is syncing. Its status updates here as it runs.` });
      } catch (error) {
        const text =
          error instanceof ApiError ? error.message : `Could not start the ${name} sync. Try again.`;
        say({ tone: "error", text });
      } finally {
        setStarting((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        refresh();
      }
    },
    [can, refresh, say],
  );

  const signIn = useCallback(
    async (key: IntegrationKey) => {
      const gate = can(signInNeed(key));
      if (!gate.allowed) {
        say({ tone: "error", text: gate.reason ?? "Your role can't connect this app." });
        return;
      }
      try {
        window.location.href = await authorizeUrl(key);
      } catch (error) {
        say({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not start the sign-in. Try again.",
        });
      }
    },
    [can, say],
  );

  const value = useMemo<HubContextValue>(
    () => ({ notice, say, connect: setConnecting, signIn, syncNow, starting, refresh }),
    [notice, say, signIn, syncNow, starting, refresh],
  );

  return (
    <HubContext.Provider value={value}>
      {children}
      <ConnectDialog appKey={connecting} onClose={() => setConnecting(null)} />
    </HubContext.Provider>
  );
}

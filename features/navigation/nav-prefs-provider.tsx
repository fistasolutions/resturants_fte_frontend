"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { useWorkspace } from "@/features/workspace/workspace-provider";
import { guidedTabs, lockedTabs } from "@/lib/guided-view";
import { navPrefsCookieString, visibleTabs } from "@/lib/nav-prefs";

interface NavPrefsValue {
  hidden: ReadonlySet<string>;
  /** Show or hide one page or tab id. */
  setShown: (id: string, shown: boolean) => void;
  showAll: () => void;
}

const EMPTY: ReadonlySet<string> = new Set();

const NavPrefsContext = createContext<NavPrefsValue>({
  hidden: EMPTY,
  setShown: () => undefined,
  showAll: () => undefined,
});

/**
 * The member's sidebar preferences (SPEC-338). The app layout reads the cookie on the server and
 * hands the hidden ids in, so the first paint is already right; a change updates every reader at
 * once and is written back to the same cookie, with no request.
 */
export function NavPrefsProvider({
  cookieName,
  initialHidden,
  children,
}: {
  cookieName: string;
  initialHidden: readonly string[];
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set(initialHidden));

  const store = useCallback(
    (next: ReadonlySet<string>) => {
      setHidden(next);
      document.cookie = navPrefsCookieString(cookieName, next);
    },
    [cookieName],
  );

  const setShown = useCallback(
    (id: string, shown: boolean) => {
      const next = new Set(hidden);
      if (shown) next.delete(id);
      else next.add(id);
      store(next);
    },
    [hidden, store],
  );

  const showAll = useCallback(() => store(EMPTY), [store]);

  const value = useMemo(() => ({ hidden, setShown, showAll }), [hidden, setShown, showAll]);
  return <NavPrefsContext.Provider value={value}>{children}</NavPrefsContext.Provider>;
}

/** Outside a provider (an auth page, a test) nothing is hidden. */
export function useNavPrefs(): NavPrefsValue {
  return useContext(NavPrefsContext);
}

/**
 * A page's tabs still shown. The guided view's locked tabs go first (SPEC-357), then the member's
 * own choices (SPEC-338) — so the tab that is always shown is the first one *with data*, and the
 * open one is always drawn.
 */
export function useVisibleTabs<T>(
  pageHref: string,
  tabs: readonly T[],
  keyOf: (tab: T) => string,
  activeKey: string | null,
): T[] {
  const { hidden } = useNavPrefs();
  const { visibility } = useWorkspace();
  const withData = guidedTabs(tabs, keyOf, lockedTabs(visibility, pageHref), activeKey);
  return visibleTabs(pageHref, withData, keyOf, hidden, activeKey);
}

"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo, BrandMark } from "@/components/shared/brand-logo";
import { LogoutDialog } from "@/features/auth/logout-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sidebarLogos } from "@/lib/branding";
import { useNavPrefs } from "@/features/navigation/nav-prefs-provider";
import { visibleNavItems } from "@/lib/nav-prefs";
import { PRODUCT, displayBrandName } from "@/lib/product";
import { visibleItems, type WorkspaceNavigation } from "@/lib/disclosure";
import { landingHref, type Visibility } from "@/lib/guided-view";
import type { WorkspaceBrand } from "@/lib/workspace";
import {
  hubChildren,
  isNavItemActive,
  isSidebarItemActive,
  sidebarItems,
  type NavItem,
} from "@/lib/navigation";
import type { UserProfile } from "@/types/store";
import { getInitials } from "@/utils/format";

interface AppSidebarProps {
  user: UserProfile;
  /** SPEC-315: what the workspace lets this member see; `null` hides nothing. */
  navigation?: WorkspaceNavigation;
  /** SPEC-357: the guided view, for where each link lands; `null` changes nothing. */
  visibility?: Visibility | null;
  /** SPEC-317: the organization's name and logos; the platform mark when none is set. */
  brand?: WorkspaceBrand;
}

/**
 * Sidebar toggle (SPEC-003 Patches): expanded shows a collapse-panel icon;
 * collapsed shows the E mark as the rail's brand mark, which swaps to an
 * expand icon on hover/focus and toggles the sidebar open.
 */
function CollapseToggle() {
  const { toggleSidebar, state } = useSidebar();

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="group/brand relative flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <BrandMark
              paper="var(--sidebar)"
              className="size-7 transition-opacity duration-150 group-hover/brand:opacity-0 group-focus-visible/brand:opacity-0"
            />
            <PanelLeftOpen
              className="absolute size-4 text-sidebar-primary opacity-0 transition-opacity duration-150 group-hover/brand:opacity-100 group-focus-visible/brand:opacity-100 dark:text-sidebar-primary-foreground"
              aria-hidden
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Expand sidebar (⌘B)</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <PanelLeftClose className="size-4" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Collapse sidebar (⌘B)</TooltipContent>
    </Tooltip>
  );
}

const ACTIVE_ROW_CLASS =
  "relative data-[active=true]:after:absolute data-[active=true]:after:top-1/2 data-[active=true]:after:left-0 data-[active=true]:after:h-4 data-[active=true]:after:w-0.5 data-[active=true]:after:-translate-y-1/2 data-[active=true]:after:rounded-full data-[active=true]:after:bg-brand";

interface NavRowProps {
  item: NavItem;
  pathname: string;
  /** The destinations a hub row opens onto (SPEC-329); empty for an ordinary row. */
  subItems: NavItem[];
  /** SPEC-357: where a link to `href` lands — its first tab with data. */
  linkHref: (href: string) => string;
  onNavigate: () => void;
}

/**
 * One sidebar destination. A hub (Digital Employees) also carries a chevron that opens
 * its employees underneath (SPEC-329): open on every page (SPEC-343), until the chevron
 * says otherwise.
 */
function NavRow({ item, pathname, subItems, linkHref, onNavigate }: NavRowProps) {
  const active = isSidebarItemActive(pathname, item);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const subListId = useId();
  const isHub = subItems.length > 0;
  const open = isHub && (toggled ?? true);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title} className={ACTIVE_ROW_CLASS}>
        <Link
          href={linkHref(item.href)}
          onClick={() => {
            if (isHub) setToggled(true);
            onNavigate();
          }}
        >
          <item.icon aria-hidden />
          <span>{item.title}</span>
          {item.badge && (
            <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary group-data-[collapsible=icon]:hidden">
              {item.badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
      {isHub && (
        <>
          <SidebarMenuAction
            type="button"
            onClick={() => setToggled(!open)}
            aria-expanded={open}
            aria-controls={subListId}
            aria-label={open ? `Hide ${item.title.toLowerCase()}` : `Show ${item.title.toLowerCase()}`}
            className="text-muted-foreground"
          >
            <ChevronRight
              aria-hidden
              className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </SidebarMenuAction>
          {open && (
            <SidebarMenuSub id={subListId}>
              {subItems.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={isNavItemActive(pathname, child.href)}>
                    <Link href={linkHref(child.href)} onClick={onNavigate}>
                      <child.icon aria-hidden />
                      <span>{child.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar({ user, navigation = null, visibility = null, brand }: AppSidebarProps) {
  const logos = sidebarLogos(brand?.logoLight ?? null, brand?.logoDark ?? null);
  const brandName = displayBrandName(brand?.name);
  const pathname = usePathname();
  // On mobile the sidebar is an overlay sheet — navigating must close it
  // (SPEC-003 Patches, owner report 2026-07-20). No-op on desktop.
  const { setOpenMobile } = useSidebar();
  const closeMobileSidebar = () => setOpenMobile(false);
  // SPEC-338: the rows and sub-pages this member switched off in Settings → Sidebar.
  const { hidden } = useNavPrefs();
  const linkHref = (href: string) => landingHref(href, visibility);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="flex flex-col gap-1 rounded-lg px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:hidden"
          >
            {logos.light && logos.dark ? (
              <>
                {/* An organization's own logo (SPEC-317): served through the proxy, any shape,
                    so it is drawn at a fixed height and never through the image optimiser. */}
                <Image
                  src={logos.light}
                  alt={brandName}
                  width={160}
                  height={40}
                  unoptimized
                  priority
                  className="h-10 w-auto max-w-40 object-contain object-left dark:hidden"
                />
                <Image
                  src={logos.dark}
                  alt=""
                  aria-hidden
                  width={160}
                  height={40}
                  unoptimized
                  priority
                  className="hidden h-10 w-auto max-w-40 object-contain object-left dark:block"
                />
              </>
            ) : (
              <BrandLogo size="md" paper="var(--sidebar)" className="text-sidebar-foreground" />
            )}
            <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {PRODUCT.descriptor}
            </span>
          </Link>
          <CollapseToggle />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {visibleNavItems(visibleItems(sidebarItems, navigation), hidden).map((item) =>
                item.enabled ? (
                  <NavRow
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    subItems={visibleNavItems(visibleItems(hubChildren(item.href), navigation), hidden)}
                    linkHref={linkHref}
                    onNavigate={closeMobileSidebar}
                  />
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          aria-disabled="true"
                          tabIndex={-1}
                          className="cursor-default opacity-50 hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent"
                        >
                          <item.icon aria-hidden />
                          <span>
                            {item.title}
                            <span className="sr-only"> (coming soon)</span>
                          </span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">Coming soon</TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />
        <div className="flex items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:px-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-8">
                <AvatarFallback className="bg-secondary text-xs font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">
              {user.name} · {user.email}
            </TooltipContent>
          </Tooltip>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <NotificationsBell />
          <ThemeToggle />
          <LogoutDialog
            trigger={
              <button
                type="button"
                aria-label="Log out"
                title="Log out"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            }
          />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

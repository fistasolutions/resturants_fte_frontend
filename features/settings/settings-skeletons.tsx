import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeletons for the Settings tabs (SPEC-324). Each has the shape of its tab — panels
 * with rows, a table, a list — so the page never jumps when the data lands. The header and tab bar
 * live in the persistent shell and stay painted (SPEC-097); these fill only the tab body, from the
 * route's `loading.tsx` and from the view while its query is pending.
 */

function PanelSkeleton({ rows = 2, footer = false }: { rows?: number; footer?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden>
      <div className="space-y-2 px-5 pt-5 pb-4 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 gap-3 border-t border-border px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-center md:gap-8"
        >
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-9 w-full max-w-xs md:ml-auto" />
        </div>
      ))}
      {footer ? (
        <div className="flex justify-end border-t border-border bg-muted/40 px-5 py-3 sm:px-6">
          <Skeleton className="h-8 w-28" />
        </div>
      ) : null}
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-52" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="border-t border-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border px-5 py-3.5 first:border-t-0 sm:px-6">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            {Array.from({ length: columns }).map((__, c) => (
              <Skeleton key={c} className={c === 0 ? "h-3.5 flex-1" : "hidden h-3.5 w-24 sm:block"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Busy({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5" role="status" aria-busy aria-label="Loading">
      {children}
    </div>
  );
}

export function StoreGeneralSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={3} />
      <PanelSkeleton rows={3} />
    </Busy>
  );
}

export function SchedulePanelSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={2} footer />
    </Busy>
  );
}

export function AutomaticSendingSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={2} footer />
      <PanelSkeleton rows={1} footer />
      <PanelSkeleton rows={1} footer />
    </Busy>
  );
}

export function ManagerNotificationsSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={4} />
      <PanelSkeleton rows={3} />
    </Busy>
  );
}

export function ListSkeleton() {
  return (
    <Busy>
      <TableSkeleton rows={4} columns={3} />
    </Busy>
  );
}

export function TeamSkeleton() {
  return (
    <Busy>
      <TableSkeleton rows={5} columns={3} />
    </Busy>
  );
}

export function RolesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]" role="status" aria-busy aria-label="Loading">
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <PanelSkeleton rows={6} />
    </div>
  );
}

export function BrandingSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={1} />
      <PanelSkeleton rows={2} />
      <PanelSkeleton rows={3} />
    </Busy>
  );
}

export function OrganizationSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={4} footer />
    </Busy>
  );
}

export function BillingSkeleton() {
  return (
    <Busy>
      <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-3.5 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 border-t border-border sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5 border-t border-border px-5 py-4 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0 sm:px-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <PanelSkeleton rows={1} />
      <TableSkeleton rows={4} columns={3} />
    </Busy>
  );
}

export function AuditSkeleton() {
  return (
    <Busy>
      <TableSkeleton rows={8} columns={2} />
    </Busy>
  );
}

export function ProfileSkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={3} footer />
    </Busy>
  );
}

export function SecuritySkeleton() {
  return (
    <Busy>
      <PanelSkeleton rows={1} />
      <TableSkeleton rows={3} columns={2} />
      <PanelSkeleton rows={1} />
    </Busy>
  );
}

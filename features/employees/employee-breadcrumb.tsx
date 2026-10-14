import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

interface Crumb {
  label: string;
  href: string;
}

/**
 * "Digital Employees › Spotlight" — rendered above an employee's own header (SPEC-290)
 * so the owner always sees where they are and how to get back to the team.
 *
 * A page *inside* an employee (a bill, SPEC-296) passes the employee as a `trail` entry,
 * giving "Digital Employees › Finance Oversight › Meridian Apparel Co" — the same
 * breadcrumb shape every drill-down in the platform uses.
 */
export function EmployeeBreadcrumb({ current, trail = [] }: { current: string; trail?: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
    >
      <Link
        href="/employees"
        className="rounded-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Digital Employees
      </Link>
      {trail.map((crumb) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link
            href={crumb.href}
            className="rounded-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {crumb.label}
          </Link>
        </Fragment>
      ))}
      <ChevronRight className="size-3.5" aria-hidden />
      <span className="max-w-[48ch] truncate font-medium text-foreground" aria-current="page">
        {current}
      </span>
    </nav>
  );
}

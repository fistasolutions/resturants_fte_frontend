"use client";

import Link from "next/link";

import { ShallowLink } from "@/components/shared/shallow-link";
import { EMAIL_MARKETING_BASE } from "@/lib/email-marketing";

/**
 * A link inside the Email Marketing Manager (SPEC-345). A tab of this page moves in place
 * (SPEC-301); anything else is a normal link that never prefetches — rows of these must not
 * fire a server render each (the Finance lesson).
 */
export function EmLink({ href, className, children, ...rest }: { href: string; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const inPage = href === EMAIL_MARKETING_BASE || href.startsWith(`${EMAIL_MARKETING_BASE}?`);
  if (inPage) {
    return (
      <ShallowLink href={href} className={className} {...rest}>
        {children}
      </ShallowLink>
    );
  }
  return (
    <Link href={href} prefetch={false} className={className} {...rest}>
      {children}
    </Link>
  );
}

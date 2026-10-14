import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";
import { BrandTheme } from "@/components/shared/brand-theme";
import { BrandPanel } from "@/features/auth/brand-panel";
import { PRODUCT } from "@/lib/product";
import { linkedLoginMedia } from "@/lib/public-branding";

// The marketing site's display serif, for the login showcase only (SPEC-312 Patches) — loaded
// here, not in the root layout, so no app page pays for it.
const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const media = await linkedLoginMedia();
  return (
    <div className={`flex min-h-svh ${displaySerif.variable}`}>
      {/* SPEC-322: the linked organization's brand colour, from the same public read (SPEC-339). */}
      <BrandTheme hex={media?.color} />
      {/* Brand panel (desktop only) — the organization's when the address names it. */}
      <BrandPanel media={media} />

      {/* Form panel */}
      <div className="relative flex min-h-svh flex-1 flex-col items-center justify-center gap-6 bg-card p-4 py-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Link
          href="/login"
          className="flex flex-col items-center gap-2 rounded-lg px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <BrandLogo size="lg" className="text-foreground" />
          <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            {PRODUCT.descriptor}
          </span>
        </Link>

        <main className="w-full max-w-sm">{children}</main>

        <p className="max-w-sm text-center text-xs text-muted-foreground">
          {PRODUCT.name} · {PRODUCT.tagline}
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Geist_Mono, Inter, Tenor_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { THEME_INIT_SCRIPT } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PRODUCT } from "@/lib/product";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The store's heading font (examplestore.com --font-heading-family).
// Single 400 weight by design — headings use it with normal weight.
const tenorSans = Tenor_Sans({
  variable: "--font-tenor",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT.name} · ${PRODUCT.descriptor}`,
    template: `%s · ${PRODUCT.short}`,
  },
  description:
    "AI-powered Business Intelligence for Shopify stores — dashboard, AI analyst chat, and daily executive reports.",
  // Absolute URLs for the share card (SPEC-215): the public address, overridable per deploy.
  metadataBase: new URL(process.env.APP_URL ?? "https://ecommerce.ftes.ai"),
  openGraph: {
    type: "website",
    siteName: PRODUCT.name,
    title: `${PRODUCT.name} · ${PRODUCT.tagline}`,
    description:
      "Every app your Shopify store runs on, side by side — Glisp for answers, and digital employees that do the work.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PRODUCT.name} · ${PRODUCT.tagline}`,
    description:
      "Every app your Shopify store runs on, side by side — Glisp for answers, and digital employees that do the work.",
  },
  // Internal tool: opt out of all indexing (SPEC-006 Patches).
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${tenorSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Applies the stored theme class before paint (SPEC-015 Patches) —
            the Next-sanctioned home for pre-hydration inline scripts. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}

import { Instrument_Serif } from "next/font/google";

// The marketing site's display serif (SPEC-320) — loaded for the pricing page only.
const displaySerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`min-h-svh bg-showcase text-showcase-foreground ${displaySerif.variable}`}>{children}</div>;
}

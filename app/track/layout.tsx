import { QueryProvider } from "@/components/shared/query-provider";

/** SPEC-379: a public page of a restaurant brand — no sign-in, its own data cache. */
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <div className="min-h-dvh bg-background text-foreground">{children}</div>
    </QueryProvider>
  );
}

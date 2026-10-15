import { QueryProvider } from "@/components/shared/query-provider";

/** SPEC-384: the driver app — no sign-in (the link is the key), its own data cache. */
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <div className="min-h-dvh bg-background text-foreground">{children}</div>
    </QueryProvider>
  );
}

import { PageHeader } from "@/components/shared/page-header";
import { DocsTabs } from "@/features/docs/docs-tabs";
import { PRODUCT } from "@/lib/product";

const DESCRIPTION =
  `Every screen of ${PRODUCT.name} — what it is, how it works, the value it creates, ` +
  "and how to use it. Read this before opening a page and you will already know it.";

/** Persistent shell for `/docs` (SPEC-229): header + the two-tier tabs stay mounted
 * across doc switches; only the article beneath changes. Rendered from the route
 * layout, so it is a Server Component wrapping the client tab bar. */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <PageHeader title="Docs" description={DESCRIPTION} />
      <DocsTabs>{children}</DocsTabs>
    </main>
  );
}

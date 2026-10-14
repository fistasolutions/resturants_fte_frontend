import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { EmailMarketingShell } from "@/features/email-marketing/email-marketing-shell";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

/** The Email Marketing Manager's persistent layout (SPEC-345): the shell paints once and
 * stays across tab switches. The workspace (connection, autonomy, kill switch), which most tabs
 * read, is started here and streamed into the client cache (SPEC-230). */
export default function EmailMarketingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient();
  prefetch(queryClient, emailMarketingQueries.workspace());
  prefetch(queryClient, emailMarketingQueries.approvals());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmailMarketingShell>{children}</EmailMarketingShell>
    </HydrationBoundary>
  );
}

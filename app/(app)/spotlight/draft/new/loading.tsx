import { BlogWritingLoader } from "@/features/spotlight/blog-writing-loader";
import { Card, CardContent } from "@/components/ui/card";

/** Route-level fallback for the first navigation into `/spotlight/draft/new`,
 * shown for the instant before the client streaming surface mounts and opens
 * the SSE stream. Article-shaped (the taller writing loader inside the same card
 * shell) so there is no blank flash or layout jump before the live view. */
export default function NewDraftLoading() {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <article>
          <Card className="overflow-hidden">
            <CardContent className="p-5 md:p-8">
              <BlogWritingLoader status="Starting…" />
            </CardContent>
          </Card>
        </article>
      </div>
    </main>
  );
}

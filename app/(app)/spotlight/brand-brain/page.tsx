import { redirect } from "next/navigation";

/** `/spotlight/brand-brain` is the Coverage sub-tab (SPEC-263). */
export default function BrandBrainIndexPage() {
  redirect("/spotlight/brand-brain/coverage");
}

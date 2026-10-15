import { redirect } from "next/navigation";

import { getWorkspace } from "@/services/workspace";

/** The landing page: a restaurant brand opens on its network (frontend SPEC-377); every other
 * organization on the Morning Brief, as before. */
export default async function HomePage() {
  const { features } = await getWorkspace();
  redirect(features.includes("restaurant") ? "/network" : "/brief");
}

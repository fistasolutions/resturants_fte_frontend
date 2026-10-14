/** Microsoft Clarity service — server transport (backend SPEC-219 / frontend
 * SPEC-214). Since SPEC-230 the paths, keys and loaders live in
 * `lib/queries/clarity.ts`; this module is their `serverApi` face. */
import { serverApi } from "@/lib/api";
import { clarityQueries } from "@/lib/queries/clarity";
import type {
  ClarityBlogEngagement,
  ClarityBrokeYesterday,
  ClarityCampaigns,
  ClarityFriction,
  ClarityFrictionDetail,
  ClarityStatus,
} from "@/types/clarity";

export async function getClarityStatus(): Promise<ClarityStatus> {
  return clarityQueries.status().load(serverApi);
}

export async function getClarityBlogEngagement(): Promise<ClarityBlogEngagement> {
  return clarityQueries.blogEngagement().load(serverApi);
}

export async function getClarityFriction(): Promise<ClarityFriction> {
  return clarityQueries.friction().load(serverApi);
}

export async function getClarityFrictionPage(handle: string): Promise<ClarityFrictionDetail> {
  return clarityQueries.frictionPage(handle).load(serverApi);
}

export async function getClarityBrokeYesterday(): Promise<ClarityBrokeYesterday> {
  return clarityQueries.brokeYesterday().load(serverApi);
}

export async function getClarityCampaigns(): Promise<ClarityCampaigns> {
  return clarityQueries.campaigns().load(serverApi);
}

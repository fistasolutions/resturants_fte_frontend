import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CiReader } from "@/features/ci/ci-reader";
import { reportById } from "@/lib/ci";
import { CI_REPORTS } from "@/lib/ci/reports";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const report = reportById(CI_REPORTS, id);
  return { title: report ? `${report.hook} · Continuous Innovation` : "Continuous Innovation" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = reportById(CI_REPORTS, id);
  if (!report) notFound();
  return <CiReader reports={CI_REPORTS} report={report} />;
}

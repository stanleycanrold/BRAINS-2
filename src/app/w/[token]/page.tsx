import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFounderWorkspace, getPublicJourney } from "@/lib/data/journey";
import { FounderWorkspace } from "./FounderWorkspace";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Founder workspace", robots: { index: false, follow: false } };
}

export default async function FounderWorkspacePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const workspace = await getFounderWorkspace(token);
  const journey = await getPublicJourney(token);
  if (!workspace || !journey) notFound();
  return <FounderWorkspace token={token} workspace={workspace} journey={journey} />;
}
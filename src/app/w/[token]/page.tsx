import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFounderWorkspace } from "@/lib/data/journey";
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
  if (!workspace) notFound();
  return <FounderWorkspace token={token} workspace={workspace} />;
}
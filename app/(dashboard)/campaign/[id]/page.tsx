import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Campaign } from "@/lib/supabase";
import { CampaignContent } from "@/components/CampaignContent";

export const revalidate = 60; // Cache responses for 60 seconds

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const campaign = data as Campaign;

  return <CampaignContent campaign={campaign} />;
}

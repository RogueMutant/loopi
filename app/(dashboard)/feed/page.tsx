import { FeedContent } from "@/components/FeedContent";
import { Suspense } from "react";
import { CampaignSkeleton } from "@/components/CampaignSkeleton";

export default async function FeedPage() {
  return (
    <>
      <Suspense fallback={<CampaignSkeleton />}>
        <FeedContent />
      </Suspense>
    </>
  );
}

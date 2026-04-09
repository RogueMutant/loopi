/**
 * CampaignSkeleton — Static dark placeholder matching CampaignCard dimensions.
 * No shimmer. Matches the 4th card in Image 1.
 */

export function CampaignSkeleton() {
  return (
    <div
      className="flex items-center gap-[14px] p-4 rounded-[12px]
        bg-[#0D1117] border-[0.5px] border-[#21262D]"
      aria-hidden="true"
    >
      {/* Score circle placeholder */}
      <div className="w-[56px] h-[56px] rounded-full bg-[#161B22] flex-shrink-0" />

      {/* Content placeholders */}
      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Title bar */}
        <div className="h-[14px] w-[65%] bg-[#161B22] rounded-[4px]" />
        {/* Protocol bar */}
        <div className="h-[11px] w-[30%] bg-[#161B22] rounded-[4px]" />
        {/* Chips row */}
        <div className="flex gap-1.5">
          <div className="h-[18px] w-[52px] bg-[#161B22] rounded-[20px]" />
          <div className="h-[18px] w-[44px] bg-[#161B22] rounded-[20px]" />
        </div>
        {/* Meta row */}
        <div className="h-[11px] w-[40%] bg-[#161B22] rounded-[4px]" />
      </div>
    </div>
  );
}

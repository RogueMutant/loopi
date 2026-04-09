export default function Loading() {
  return (
    <div className="max-w-[960px] mx-auto py-8">
      <div className="h-4 w-48 bg-[#161B22] rounded mb-8 animate-pulse" />
      <div className="flex items-center gap-4 mb-6">
        <div className="w-[72px] h-[72px] rounded-full bg-[#161B22] animate-pulse" />
        <div className="h-6 w-[300px] bg-[#161B22] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-3">
          <div className="h-4 w-full bg-[#161B22] rounded animate-pulse" />
          <div className="h-4 w-[90%] bg-[#161B22] rounded animate-pulse" />
          <div className="h-4 w-[75%] bg-[#161B22] rounded animate-pulse" />
        </div>
        <div className="h-[240px] bg-[#161B22] rounded-[12px] animate-pulse" />
      </div>
    </div>
  );
}

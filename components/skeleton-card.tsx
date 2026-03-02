export default function SkeletonCard() {
  return (
    <div className="flex flex-col p-5 sm:p-6 bg-bg-card border-2 border-border h-full animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 sm:mb-5">
        <div className="flex gap-3 sm:gap-4 items-start w-full">
          <div className="min-w-0 flex-1">
            <div className="h-6 bg-border rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-border rounded w-1/2"></div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4 flex-1 space-y-2">
        <div className="h-4 bg-border rounded w-full"></div>
        <div className="h-4 bg-border rounded w-5/6"></div>
        <div className="h-4 bg-border rounded w-4/6"></div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        <div className="h-6 bg-border rounded w-16"></div>
        <div className="h-6 bg-border rounded w-20"></div>
        <div className="h-6 bg-border rounded w-12"></div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-border">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-4 bg-border rounded w-8"></div>
          <div className="h-4 bg-border rounded w-12"></div>
          <div className="h-4 bg-border rounded w-10"></div>
        </div>
      </div>
    </div>
  );
}
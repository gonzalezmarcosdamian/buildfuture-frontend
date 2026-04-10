function SkeletonRow() {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-bf-border last:border-0">
      <div className="h-3 w-24 bg-bf-surface-3 rounded animate-pulse" />
      <div className="h-3 w-16 bg-bf-surface-3 rounded animate-pulse" />
    </div>
  );
}

export default function InstrumentDetailLoading() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">
      {/* Back link placeholder */}
      <div className="h-4 w-20 bg-bf-surface-3 rounded animate-pulse" />

      {/* Header card */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-bf-surface-3 rounded animate-pulse" />
              <div className="h-4 w-14 bg-bf-surface-3 rounded animate-pulse" />
            </div>
            <div className="h-3 w-32 bg-bf-surface-3 rounded animate-pulse" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-5 w-20 bg-bf-surface-3 rounded animate-pulse ml-auto" />
            <div className="h-3 w-14 bg-bf-surface-3 rounded animate-pulse ml-auto" />
          </div>
        </div>
        {/* P&L hero placeholder */}
        <div className="h-14 rounded-xl bg-bf-surface-3/60 animate-pulse" />
      </div>

      {/* Metrics card */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4">
        <div className="h-3 w-20 bg-bf-surface-3 rounded animate-pulse mb-3" />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>

      {/* Context card */}
      <div className="bg-bf-surface rounded-2xl border border-bf-border p-4 space-y-3">
        <div className="h-3 w-32 bg-bf-surface-3 rounded animate-pulse" />
        <div className="h-3 w-full bg-bf-surface-3 rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-bf-surface-3 rounded animate-pulse" />
        <div className="h-3 w-3/5 bg-bf-surface-3 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse bg-neutral-100 rounded-lg ${className}`} />
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
      <SkeletonBlock className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-neutral-100">
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-5 w-2/3" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-1/3" />
      </div>
      <SkeletonBlock className="w-20 h-20 rounded-xl flex-shrink-0" />
    </div>
  )
}

export function OrderRowSkeleton() {
  return (
    <div className="flex gap-3 py-4 border-b border-neutral-100">
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-5 w-1/2" />
        <SkeletonBlock className="h-4 w-1/3" />
      </div>
      <SkeletonBlock className="h-6 w-20 rounded-full" />
    </div>
  )
}

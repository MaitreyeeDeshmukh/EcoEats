export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden animate-fade-in">
      <Skeleton className="w-full h-44" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-24 rounded-btn" />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-card" />
      <Skeleton className="h-24 w-full rounded-card" />
    </div>
  )
}

// Reusable loading-skeleton primitives. Pure CSS (animate-pulse), so these
// can render inside server `loading.tsx` files without a client boundary.

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  );
}

// A generic card block placeholder.
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="h-5 w-3/4" />
    </div>
  );
}

// A list-row placeholder (avatar + two lines + chevron).
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-3" />
    </div>
  );
}

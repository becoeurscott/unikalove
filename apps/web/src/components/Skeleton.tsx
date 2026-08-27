/**
 * Shimmer placeholders. Shapes mirror the real content so the layout does not
 * jump when data arrives — the shimmer itself is pure CSS (see globals.css).
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`unika-shimmer rounded-lg ${className}`} aria-hidden />;
}

/** Discover / daily-pick card placeholder. */
export function ProfileCardSkeleton() {
  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-card border border-gray-100 bg-white">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex justify-around border-t border-gray-50 pt-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Grid of avatar+name tiles (matches, likes, favourites). */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-gray-100 bg-white p-4 text-center">
          <Skeleton className="mx-auto mb-2 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto h-4 w-20" />
          <Skeleton className="mx-auto mt-1.5 h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

/** Conversation list rows. */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-gray-50 rounded-card border border-gray-100 bg-white">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Chat bubbles, alternating sides. */
export function ChatSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
          <Skeleton
            className={`h-10 rounded-2xl ${i % 2 ? 'w-40' : 'w-52'}`}
          />
        </div>
      ))}
    </div>
  );
}

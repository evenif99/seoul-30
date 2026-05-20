import { Skeleton } from '@/components/ui/skeleton'

export function PlaceCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
    >
      <div className="flex gap-0">
        {/* 이미지 */}
        <Skeleton className="w-[130px] shrink-0 min-h-[130px] rounded-none" />

        {/* 콘텐츠 */}
        <div className="flex-1 p-3.5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <Skeleton className="h-3 w-16 mx-auto" />
      </div>
    </div>
  )
}

import { MapPin } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-3">
        <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">조건에 맞는 장소가 없어요</p>
      <p className="text-xs text-muted-foreground mt-1">필터를 조정해 보세요</p>
    </div>
  )
}

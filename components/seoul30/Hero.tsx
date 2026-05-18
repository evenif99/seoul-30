'use client'

import { Sun, Ticket, Users } from 'lucide-react'
import { TODAY_CONDITIONS } from '@/lib/data'

type IconName = 'sun' | 'ticket' | 'users'

const ICON_MAP: Record<IconName, React.ElementType> = {
  sun: Sun,
  ticket: Ticket,
  users: Users,
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '새벽에도 갈 수 있는'
  if (hour < 11) return '오전에 가기 좋은'
  if (hour < 14) return '점심 시간에 가기 좋은'
  if (hour < 18) return '오후에 가기 좋은'
  if (hour < 21) return '저녁에 가기 좋은'
  return '지금 출발해도 좋은'
}

export function Hero() {
  const greeting = getTimeGreeting()

  return (
    <section className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      {/* Main heading */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground leading-snug text-balance">
          <span className="text-primary">30분</span> 안에 갈 수 있는
          <br />
          추천 장소를 만나보세요
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {greeting} 곳을 지금 출발 기준으로 추천드려요
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          대중교통 기준 · 자치구 단위 추천
        </p>
      </div>

      {/* Today's condition chips */}
      <div className="flex items-center gap-2 flex-wrap" role="list" aria-label="오늘의 조건">
        {TODAY_CONDITIONS.map((cond) => {
          const Icon = ICON_MAP[cond.icon as IconName]
          return (
            <div
              key={cond.label}
              role="listitem"
              className="flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full"
            >
              <Icon className="w-3 h-3" aria-hidden="true" />
              <span>{cond.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

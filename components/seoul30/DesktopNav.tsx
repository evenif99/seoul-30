'use client'

import { Home, Search, Bookmark, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'search', label: '탐색', icon: Search },
  { id: 'saved', label: '저장함', icon: Bookmark },
  { id: 'settings', label: '설정', icon: Settings },
] as const

type NavId = (typeof NAV_ITEMS)[number]['id']

interface DesktopNavProps {
  activeTab: NavId
  onTabChange: (id: NavId) => void
}

export function DesktopNav({ activeTab, onTabChange }: DesktopNavProps) {
  return (
    <nav
      aria-label="사이드 탐색"
      className="hidden md:flex flex-col gap-1 w-56 shrink-0 pt-6 pr-6"
    >
      <div className="mb-4 px-3">
        <span className="text-2xl font-bold text-primary tracking-tight">Seoul 30</span>
        <p className="text-xs text-muted-foreground mt-0.5">30분 생활권 추천</p>
      </div>

      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
            activeTab === id
              ? 'bg-accent text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Icon className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  )
}

export type { NavId }

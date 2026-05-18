'use client'

import { Home, Search, Bookmark, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'home', label: '홈', icon: Home },
  { id: 'search', label: '탐색', icon: Search },
  { id: 'saved', label: '저장함', icon: Bookmark },
  { id: 'settings', label: '설정', icon: Settings },
] as const

type TabId = (typeof TABS)[number]['id']

interface BottomTabBarProps {
  activeTab: TabId
  onTabChange: (id: TabId) => void
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav
      aria-label="하단 탐색"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              activeTab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon
              className={cn('w-5 h-5 transition-colors', activeTab === id && 'stroke-[2.5]')}
              aria-hidden="true"
            />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export type { TabId }

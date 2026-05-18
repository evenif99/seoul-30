'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: '홈', icon: Home, href: '/' },
  { label: '저장함', icon: Bookmark, href: '/bookmarks' },
] as const

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="하단 탐색"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto">
        {TABS.map(({ label, icon: Icon, href }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn('w-5 h-5 transition-colors', isActive && 'stroke-[2.5]')}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

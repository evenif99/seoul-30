'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: '홈', icon: Home, href: '/' },
  { label: '저장함', icon: Bookmark, href: '/bookmarks' },
] as const

export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="사이드 탐색"
      className="hidden md:flex flex-col gap-1 w-56 shrink-0 pt-6 pr-6"
    >
      <div className="mb-4 px-3">
        <span className="text-2xl font-bold text-primary tracking-tight">Seoul 30</span>
        <p className="text-xs text-muted-foreground mt-0.5">30분 생활권 추천</p>
      </div>

      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

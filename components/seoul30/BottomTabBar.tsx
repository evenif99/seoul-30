'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bookmark } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useBookmark } from '@/hooks/use-bookmark'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'home' as const, icon: Home, href: '/' },
  { key: 'bookmarks' as const, icon: Bookmark, href: '/bookmarks' },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { bookmarks } = useBookmark()
  const bookmarkCount = bookmarks.length

  return (
    <nav
      aria-label={t('bottomLabel')}
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch max-w-2xl mx-auto">
        {TABS.map(({ key, icon: Icon, href }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const showBadge = key === 'bookmarks' && bookmarkCount > 0
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={showBadge ? t('bookmarkCount', { count: bookmarkCount }) : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="relative">
                <Icon
                  className={cn('w-5 h-5 transition-colors', isActive && 'stroke-[2.5]')}
                  aria-hidden="true"
                />
                {showBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none"
                  >
                    {bookmarkCount > 99 ? '99+' : bookmarkCount}
                  </span>
                )}
              </span>
              <span>{t(key)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

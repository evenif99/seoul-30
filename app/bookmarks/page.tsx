'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Clock } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useBookmark } from '@/hooks/use-bookmark'
import { useRecent } from '@/hooks/use-recent'
import { MOCK_PLACES } from '@/lib/mock/places'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import { relativeTime } from '@/lib/utils/relative-time'
import type { NormalizedPlace } from '@/lib/types/place'

type Tab = 'saved' | 'recent'
type SortOrder = 'date' | 'name' | 'category'

/** localStorage에 저장된 장소 데이터를 읽어 ID로 resolve.
 *  북마크/최근본 저장 시 place 데이터도 함께 저장하므로 실 API 장소도 표시 가능. */
function resolvePlaces(ids: string[]): NormalizedPlace[] {
  let storedData: Record<string, NormalizedPlace> = {}
  try {
    const bookmarkData: Record<string, NormalizedPlace> = JSON.parse(
      localStorage.getItem('seoul30:bookmark_data') ?? '{}'
    )
    const recentData: Record<string, NormalizedPlace> = JSON.parse(
      localStorage.getItem('seoul30:recent_data') ?? '{}'
    )
    storedData = { ...recentData, ...bookmarkData }
  } catch {}

  return ids
    .map((id) => storedData[id] ?? MOCK_PLACES.find((p) => p.id === id))
    .filter((p): p is NormalizedPlace => p !== undefined)
}

function sortPlaces(places: NormalizedPlace[], order: SortOrder): NormalizedPlace[] {
  if (order === 'date') return places // 이미 최신순 (배열 앞이 최신)
  if (order === 'name') return [...places].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  if (order === 'category') return [...places].sort((a, b) => a.category.localeCompare(b.category))
  return places
}

function EmptyMessage({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  const t = useTranslations('bookmarks')
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <Icon className="w-10 h-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/" className="mt-4 text-sm text-primary hover:underline">
        {t('backToExplore')}
      </Link>
    </div>
  )
}

export default function BookmarksPage() {
  const t = useTranslations('bookmarks')
  const tNav = useTranslations('nav')
  const locale = useLocale() as 'ko' | 'en'
  const [activeTab, setActiveTab] = useState<Tab>('saved')
  const [sortOrder, setSortOrder] = useState<SortOrder>('date')
  const { bookmarks } = useBookmark()
  const { recent, timestamps } = useRecent()

  // 탭 전환 시 스크롤 최상단 이동
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activeTab])

  const savedPlaces = sortPlaces(resolvePlaces(bookmarks), sortOrder)
  const recentPlaces = resolvePlaces(recent)

  const places = activeTab === 'saved' ? savedPlaces : recentPlaces

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3 py-4 border-b border-border">
          <Link
            href="/"
            className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={tNav('home')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-foreground">{t('title')}</h1>
        </div>

        {/* 탭 */}
        <div
          className="flex gap-1 mt-4 bg-muted rounded-xl p-1"
          role="tablist"
          aria-label={t('title')}
        >
          <button
            id="tab-saved"
            role="tab"
            aria-selected={activeTab === 'saved'}
            aria-controls="tabpanel-places"
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'saved'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
            {t('saved')}
            {bookmarks.length > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none" aria-hidden="true">
                {bookmarks.length}
              </span>
            )}
          </button>
          <button
            id="tab-recent"
            role="tab"
            aria-selected={activeTab === 'recent'}
            aria-controls="tabpanel-places"
            onClick={() => setActiveTab('recent')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'recent'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {t('recent')}
          </button>
        </div>

        {/* 저장됨 탭 정렬 옵션 */}
        {activeTab === 'saved' && savedPlaces.length > 0 && (
          <div className="flex gap-1.5 mt-3 mb-1" role="group" aria-label={locale === 'ko' ? '정렬 기준' : 'Sort order'}>
            {(['date', 'name', 'category'] as SortOrder[]).map((order) => (
              <button
                key={order}
                onClick={() => setSortOrder(order)}
                aria-pressed={sortOrder === order}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  sortOrder === order
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {t(order === 'date' ? 'sortByDate' : order === 'name' ? 'sortByName' : 'sortByCategory')}
              </button>
            ))}
          </div>
        )}

        {/* 장소 목록 */}
        <section
          id="tabpanel-places"
          role="tabpanel"
          aria-labelledby={activeTab === 'saved' ? 'tab-saved' : 'tab-recent'}
          aria-label={activeTab === 'saved' ? t('savedLabel') : t('recentLabel')}
          className="mt-4"
        >
          {places.length === 0 ? (
            activeTab === 'saved' ? (
              <EmptyMessage icon={Bookmark} message={t('emptySaved')} />
            ) : (
              <EmptyMessage icon={Clock} message={t('emptyRecent')} />
            )
          ) : (
            <div className="flex flex-col gap-3 pb-10">
              {places.map((place) => {
                const ts = activeTab === 'recent' ? timestamps[place.id] : undefined
                const visitedLabel = ts != null
                  ? t('visitedAt', { time: relativeTime(new Date(ts).toISOString(), locale) })
                  : activeTab === 'recent'
                    ? t('visitedUnknown')
                    : undefined
                return (
                  <div key={place.id}>
                    {visitedLabel && (
                      <p className="text-[11px] text-muted-foreground mb-1 pl-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 inline-block" aria-hidden="true" />
                        {visitedLabel}
                      </p>
                    )}
                    <PlaceCard place={place} />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

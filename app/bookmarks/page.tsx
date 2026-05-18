'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Clock } from 'lucide-react'
import { useBookmark } from '@/hooks/use-bookmark'
import { useRecent } from '@/hooks/use-recent'
import { MOCK_PLACES } from '@/lib/mock/places'
import { PlaceCard } from '@/components/seoul30/PlaceCard'
import type { NormalizedPlace } from '@/lib/types/place'

type Tab = 'saved' | 'recent'

function resolvePlaces(ids: string[]): NormalizedPlace[] {
  return ids
    .map((id) => MOCK_PLACES.find((p) => p.id === id))
    .filter((p): p is NormalizedPlace => p !== undefined)
}

function EmptyMessage({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <Icon className="w-10 h-10 text-muted-foreground/40 mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/" className="mt-4 text-sm text-primary hover:underline">
        장소 탐색하러 가기
      </Link>
    </div>
  )
}

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState<Tab>('saved')
  const { bookmarks } = useBookmark()
  const { recent } = useRecent()

  const savedPlaces = resolvePlaces(bookmarks)
  const recentPlaces = resolvePlaces(recent)

  const places = activeTab === 'saved' ? savedPlaces : recentPlaces

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3 py-4 border-b border-border">
          <Link
            href="/"
            className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="홈으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-foreground">나의 장소</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mt-4 mb-5 bg-muted rounded-xl p-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'saved'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
            저장됨
            {bookmarks.length > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                {bookmarks.length}
              </span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'recent'}
            onClick={() => setActiveTab('recent')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'recent'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            최근 본
          </button>
        </div>

        {/* 장소 목록 */}
        <section aria-label={activeTab === 'saved' ? '저장된 장소 목록' : '최근 본 장소 목록'}>
          {places.length === 0 ? (
            activeTab === 'saved' ? (
              <EmptyMessage
                icon={Bookmark}
                message="저장된 장소가 없어요. 장소 카드의 북마크 버튼을 눌러보세요."
              />
            ) : (
              <EmptyMessage
                icon={Clock}
                message="최근 본 장소가 없어요. 장소를 탐색해보세요."
              />
            )
          ) : (
            <div className="flex flex-col gap-3 pb-10">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

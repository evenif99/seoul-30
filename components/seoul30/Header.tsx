'use client'

import { useState } from 'react'
import { MapPin, ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { PushSubscribeButton } from '@/components/seoul30/PushSubscribeButton'

const LOCATIONS = ['성수동, 서울', '홍대입구, 서울', '강남역, 서울', '종로, 서울', '여의도, 서울']

interface HeaderProps {
  onSearchOpen?: () => void
}

export function Header({ onSearchOpen }: HeaderProps) {
  const [location, setLocation] = useState(LOCATIONS[0])
  const [locationOpen, setLocationOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <span className="text-xl font-bold text-primary tracking-tight shrink-0">
          Seoul 30
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {/* Location selector */}
          <div className="relative">
            <button
              onClick={() => setLocationOpen((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-full px-3 py-1.5 hover:border-primary/40 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={locationOpen}
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="max-w-[120px] truncate">{location}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${locationOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {locationOpen && (
              <ul
                role="listbox"
                aria-label="지역 선택"
                className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-border rounded-xl shadow-lg py-1 z-50"
              >
                {LOCATIONS.map((loc) => (
                  <li key={loc}>
                    <button
                      role="option"
                      aria-selected={loc === location}
                      onClick={() => { setLocation(loc); setLocationOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${loc === location ? 'text-primary font-medium' : 'text-foreground'}`}
                    >
                      {loc}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PushSubscribeButton />

          {/* Search button */}
          <button
            onClick={onSearchOpen}
            aria-label="검색"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}

'use client'

import { MapPin } from 'lucide-react'
import { SEOUL_DISTRICTS } from '@/lib/districts'

interface DistrictSelectorProps {
  value: string
  onChange: (district: string) => void
}

export function DistrictSelector({ value, onChange }: DistrictSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-2">
      <label htmlFor="district-select" className="sr-only">자치구 선택</label>
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none"
          aria-hidden="true"
        />
        <select
          id="district-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          <option value="">서울 전체</option>
          {SEOUL_DISTRICTS.map((d) => (
            <option key={d.code} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

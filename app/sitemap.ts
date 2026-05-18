import type { MetadataRoute } from 'next'
import { MOCK_PLACES } from '@/lib/mock/places'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://seoul-30.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const placeEntries: MetadataRoute.Sitemap = MOCK_PLACES.map((place) => ({
    url: `${BASE_URL}/place/${place.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/bookmarks`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...placeEntries,
  ]
}

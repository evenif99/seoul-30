import type { MetadataRoute } from 'next'
import { getSnapshotPlaces } from '@/lib/data/place-detail'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://seoul-30-webapp.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshotPlaces = await getSnapshotPlaces()

  const placeEntries: MetadataRoute.Sitemap = snapshotPlaces.map((place) => ({
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
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...placeEntries,
  ]
}

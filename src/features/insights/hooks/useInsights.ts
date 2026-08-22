import {
  useEffect,
  useState,
} from 'react'

import { getInsights } from '#/features/insights/queries'

type InsightsData = Awaited<
  ReturnType<typeof getInsights>
>

export function useInsights() {
  const [data, setData] =
    useState<InsightsData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadInsights() {
      try {
        const nextData =
          await getInsights()

        if (!cancelled) {
          setData(nextData)
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to load insights:',
            error,
          )
        }
      }
    }

    void loadInsights()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    data,
  }
}
import { useEffect, useState } from 'react'

import { getInsights } from '#/features/insights/queries'

type InsightsData = Awaited<ReturnType<typeof getInsights>>

const REFRESH_INTERVAL = 2000

export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadInsights() {
      const nextData = await getInsights()

      if (!cancelled) {
        setData(nextData)
      }
    }

    void loadInsights()

    const intervalId = window.setInterval(() => {
      void loadInsights()
    }, REFRESH_INTERVAL)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  return {
    data,
  }
}
import { useEffect, useState } from 'react'
import { db, type BaselineFeature } from '#/db/dexie'
import { type BaselineMap, createEmptyBaseline, hasBaseline } from '#/lib/baseline'

export function useBaseline() {
  const [baseline, setBaseline] = useState<BaselineMap>(createEmptyBaseline())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    db.baselineFeatures.toArray().then((rows: BaselineFeature[]) => {
      if (!alive) return
      const map = createEmptyBaseline()
      for (const r of rows) map[r.name] = { mean: r.mean, variance: r.variance, stddev: r.stddev, sampleCount: r.sampleCount }
      setBaseline(map)
      setReady(true)
    })
    const interval = setInterval(() => {
      db.baselineFeatures.toArray().then((rows: BaselineFeature[]) => {
        const map = createEmptyBaseline()
        for (const r of rows) map[r.name] = { mean: r.mean, variance: r.variance, stddev: r.stddev, sampleCount: r.sampleCount }
        setBaseline(map)
      })
    }, 5000)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [])

  return { baseline, ready, hasBaseline: hasBaseline(baseline) }
}

import { useEffect, useState } from 'react'
import { type BaselineMap, createEmptyBaseline, hasBaseline } from '#/lib/baseline'
import { baselineRepository } from '#/repositories/baselineRepository'

export function useBaseline() {
  const [baseline, setBaseline] = useState<BaselineMap>(createEmptyBaseline())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    baselineRepository.getAll().then((map) => {
      if (!alive) return
      setBaseline(map)
      setReady(true)
    })
    const interval = setInterval(() => {
      void baselineRepository.getAll().then((map) => {
        if (!alive) return
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

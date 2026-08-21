import { useEffect, useRef, useState } from 'react'
import { createCapture, type AggregatedFeatures } from '#/lib/signals'

export function useSignalCapture(enabled: boolean) {
  const handleRef = useRef<ReturnType<typeof createCapture> | null>(null)
  const [live, setLive] = useState<AggregatedFeatures | null>(null)
  const [eventsCount, setEventsCount] = useState(0)

  if (!handleRef.current) handleRef.current = createCapture()
  const handle = handleRef.current

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      // architectural discard: only timing + isCorrection boolean derived
      handle.onKeyDown({ key: e.key, timeStamp: performance.now() })
      setEventsCount((c) => c + 1)
    }
    function onKeyUp(e: KeyboardEvent) {
      handle.onKeyUp({ key: e.key, timeStamp: performance.now() })
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const id = window.setInterval(() => {
      const snap = handle.snapshot(60_000)
      if (snap) setLive(snap)
    }, 1000)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      clearInterval(id)
    }
  }, [enabled, handle])

  return { live, eventsCount, handle, reset: () => handle.reset() }
}

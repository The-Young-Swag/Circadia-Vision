import { useCallback, useEffect, useState } from 'react'
import { createCapture, type AggregatedFeatures } from '#/shared/lib/signals'

// Reusable React behavior — encapsulates timing capture (external system)
// Pure: handle is created once via lazy state initializer, never during render assignment
export function useSignalCapture(enabled: boolean) {
  const [handle] = useState(() => createCapture())
  const [live, setLive] = useState<AggregatedFeatures | null>(null)
  const [eventsCount, setEventsCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
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

  const reset = useCallback(() => handle.reset(), [handle])

  return { live, eventsCount, handle, reset }
}

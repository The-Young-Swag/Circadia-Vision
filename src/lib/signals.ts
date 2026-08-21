/**
 * Signal capture — timing only, never content.
 * Architectural guarantee: the listener resolves to a timing delta
 * and the actual `key` value is discarded synchronously.
 */

export type TimingEvent = {
  interKeyLatency: number // flight time ms (keyup -> next keydown)
  dwellTime: number // press->release ms
  isCorrection: boolean // was this a correction (Backspace)
  timestamp: number // performance.now()
}

export type AggregatedFeatures = {
  interKeyLatency: number // mean IKL this window
  dwellTime: number // mean dwell
  correctionRate: number // corrections / total keys
  wpm: number // words per minute (5 chars = 1 word)
}

/**
 * Pure aggregation over a rolling window of TimingEvents.
 * Call per minute or on demand; no DOM needed, hence testable.
 */
export function aggregate(
  events: TimingEvent[],
  windowMs: number = 60_000,
): AggregatedFeatures | null {
  if (events.length < 5) return null
  const now = events[events.length - 1]!.timestamp
  const windowStart = now - windowMs
  const win = events.filter((e) => e.timestamp >= windowStart)
  if (win.length < 5) return null

  const ikls = win.map((e) => e.interKeyLatency).filter((v) => v >= 0 && v < 5000)
  const dwells = win.map((e) => e.dwellTime).filter((v) => v >= 0 && v < 1000)
  const corrections = win.filter((e) => e.isCorrection).length

  const interKeyLatency = mean(ikls) ?? 0
  const dwellTime = mean(dwells) ?? 0
  const correctionRate = corrections / win.length
  const wpm = computeWpm(win, windowMs)

  return { interKeyLatency, dwellTime, correctionRate, wpm }
}

function mean(arr: number[]): number | null {
  if (arr.length === 0) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function computeWpm(events: TimingEvent[], windowMs: number): number {
  // 5 chars = 1 word, WPM = (chars / 5) / minutes
  const chars = events.filter((e) => !e.isCorrection).length
  const minutes = windowMs / 60000
  return (chars / 5) / minutes
}

// ---------------------------------------------------------------------------
// Live capture hook helper — creates a timing-only listener.
// The actual `key` is inspected only to detect Backspace vs other, then dropped.
// No key content is stored or emitted.
// ---------------------------------------------------------------------------

export type CaptureHandle = {
  /** Call on keydown; key value is examined synchronously then discarded */
  onKeyDown: (e: { key: string; timeStamp: number }) => void
  /** Call on keyup */
  onKeyUp: (e: { key: string; timeStamp: number }) => void
  /** Snapshot of current events */
  getEvents: () => TimingEvent[]
  /** Reset after session / minute */
  reset: () => void
  /** Aggregate current window */
  snapshot: (windowMs?: number) => AggregatedFeatures | null
}

export function createCapture(): CaptureHandle {
  const events: TimingEvent[] = []
  let lastKeyDown: number | null = null
  let lastKeyUp: number | null = null
  let pendingDwellStart: number | null = null

  return {
    onKeyDown(e) {
      const isCorrection = e.key === 'Backspace'
      // key value used only for this boolean, then discarded
      const now = e.timeStamp
      const ikl = lastKeyUp !== null ? now - lastKeyUp : 0
      // dwell will be set on keyup; store pending
      pendingDwellStart = now
      lastKeyDown = now
      // we don't store key, only timing; push placeholder to be completed on keyup
      // Instead we push on keyup when we know dwell; for hold we track now.
      // For simplicity push on keydown with current ikl, dwell=0, correct flag
      // then update dwell on keyup
      events.push({
        interKeyLatency: ikl < 0 ? 0 : ikl,
        dwellTime: 0,
        isCorrection,
        timestamp: now,
      })
    },
    onKeyUp(e) {
      const now = e.timeStamp
      lastKeyUp = now
      if (pendingDwellStart !== null && events.length > 0) {
        const last = events[events.length - 1]!
        // only set dwell for the most recent event if not yet set
        if (last.dwellTime === 0) {
          const dwell = now - pendingDwellStart
          last.dwellTime = dwell < 0 ? 0 : dwell > 2000 ? 2000 : dwell
        }
      }
      pendingDwellStart = null
      // key value discarded; we only needed timing
      void e.key
    },
    getEvents: () => [...events],
    reset: () => {
      events.length = 0
      lastKeyDown = null
      lastKeyUp = null
      pendingDwellStart = null
    },
    snapshot: (windowMs = 60_000) => aggregate(events, windowMs),
  }
}

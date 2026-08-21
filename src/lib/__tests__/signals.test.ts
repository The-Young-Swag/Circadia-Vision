import { describe, expect, it } from 'vitest'
import { aggregate, createCapture } from '#/lib/signals'

describe('signals aggregation', () => {
  it('returns null for too few events', () => {
    expect(aggregate([])).toBeNull()
    expect(aggregate([{ interKeyLatency: 100, dwellTime: 80, isCorrection: false, timestamp: 0 }])).toBeNull()
  })

  it('computes WPM and correction rate', () => {
    const now = 100000
    const events = Array.from({ length: 20 }, (_, i) => ({
      interKeyLatency: 120,
      dwellTime: 90,
      isCorrection: i % 10 === 0,
      timestamp: now - 30000 + i * 1000,
    }))
    const agg = aggregate(events, 60000)!
    expect(agg.interKeyLatency).toBeCloseTo(120, 0)
    expect(agg.dwellTime).toBeCloseTo(90, 0)
    expect(agg.correctionRate).toBeCloseTo(0.1, 1)
    // 18 chars (20-2 corrections) in 60s => (18/5)=3.6 wpm
    expect(agg.wpm).toBeCloseTo(3.6, 1)
  })

  it('createCapture discards key content and only stores timing', () => {
    const h = createCapture()
    h.onKeyDown({ key: 'a', timeStamp: 1000 })
    h.onKeyUp({ key: 'a', timeStamp: 1080 })
    h.onKeyDown({ key: 'Backspace', timeStamp: 1200 })
    h.onKeyUp({ key: 'Backspace', timeStamp: 1250 })
    h.onKeyDown({ key: 'b', timeStamp: 1400 })
    h.onKeyUp({ key: 'b', timeStamp: 1480 })
    const ev = h.getEvents()
    expect(ev.length).toBe(3)
    expect(ev[1]!.isCorrection).toBe(true)
    expect(ev[0]!.isCorrection).toBe(false)
    // Ensure no key string stored
    expect((ev[0] as unknown as Record<string, unknown>).key).toBeUndefined()
    expect(ev[0]!.dwellTime).toBeGreaterThan(0)
  })
})

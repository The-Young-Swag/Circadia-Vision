import { describe, expect, it } from 'vitest'
import {
  createEmptyBaseline,
  updateEwma,
  zScore,
  hasBaseline,
  isElevatedLoad,
  recommendBreakMinutes,
  peakWindow,
  MIN_SAMPLES_FOR_BASELINE,
} from '#/lib/baseline'

describe('EWMA baseline', () => {
  it('starts empty and gains samples', () => {
    const b = createEmptyBaseline()
    expect(hasBaseline(b)).toBe(false)
    let snap = updateEwma(b.interKeyLatency, 100)
    expect(snap.sampleCount).toBe(1)
    // fill enough samples
    let cur = snap
    for (let i = 0; i < MIN_SAMPLES_FOR_BASELINE; i++) cur = updateEwma(cur, 100 + i)
    const map = { ...b, interKeyLatency: cur, dwellTime: cur, correctionRate: cur, wpm: cur }
    expect(hasBaseline(map)).toBe(true)
  })

  it('zScore near zero for mean', () => {
    let s = updateEwma(createEmptyBaseline().interKeyLatency, 100)
    for (let i = 0; i < 10; i++) s = updateEwma(s, 100 + (Math.random() - 0.5) * 2)
    expect(Math.abs(zScore(100, s))).toBeLessThan(1)
  })

  it('elevated detection requires sustained window', () => {
    let base = createEmptyBaseline()
    for (const k of Object.keys(base) as Array<keyof typeof base>) {
      let s = base[k]
      for (let i = 0; i < 10; i++) s = updateEwma(s, k === 'wpm' ? 60 : 100)
      base[k] = s
    }
    // normal window -> not elevated
    const normal = Array.from({ length: 3 }, () => ({ interKeyLatency: 100, dwellTime: 90, correctionRate: 0.05, wpm: 60 }))
    expect(isElevatedLoad(normal, base)).toBe(false)

    // fatigued: high IKL, high dwell, high corr, low wpm
    const fatigued = Array.from({ length: 3 }, () => ({ interKeyLatency: 160, dwellTime: 130, correctionRate: 0.15, wpm: 35 }))
    expect(isElevatedLoad(fatigued, base)).toBe(true)

    // only 2 minutes sustained when 3 required -> false
    expect(isElevatedLoad(fatigued.slice(0, 2), base)).toBe(false)
  })

  it('recommendBreak uses median clamped', () => {
    expect(recommendBreakMinutes([])).toBe(5)
    expect(recommendBreakMinutes([20])).toBe(15) // clamped
    expect(recommendBreakMinutes([1])).toBe(2) // clamped min 2
    expect(recommendBreakMinutes([2, 4, 6, 10])).toBe(5) // median of 4,6 =>5
  })

  it('peakWindow picks hour with smallest deviation', () => {
    const m = new Map<number, number[]>()
    m.set(9, [0.2, 0.3, 0.25, 0.2, 0.3])
    m.set(14, [1.2, 1.1, 1.3, 1.0, 1.2])
    m.set(22, [0.1, 0.12, 0.11, 0.13, 0.1]) // best
    expect(peakWindow(m)).toBe(22)
    expect(peakWindow(new Map())).toBe(null)
  })
})

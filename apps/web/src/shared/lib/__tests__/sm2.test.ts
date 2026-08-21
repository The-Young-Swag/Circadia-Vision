import { describe, expect, it } from 'vitest'
import {
  sm2,
  initialState,
  confidenceScore,
  daysOverdue,
  isDue,
} from '#/shared/lib/sm2'

describe('SM-2', () => {
  const fixedNow = new Date('2026-08-21T12:00:00.000Z')

  it('initial Again resets interval to 1 and keeps ease >=1.3', () => {
    const s0 = initialState()
    const r = sm2(s0, 0, fixedNow)
    expect(r.interval).toBe(1)
    expect(r.repetitions).toBe(0)
    expect(r.easeFactor).toBeGreaterThanOrEqual(1.3)
    expect(r.dueDate).toBe('2026-08-22')
  })

  it('first Good sets interval 1', () => {
    const r = sm2(initialState(), 2, fixedNow)
    expect(r.interval).toBe(1)
    expect(r.repetitions).toBe(1)
  })

  it('second Good sets interval 6', () => {
    const afterFirst = sm2(initialState(), 2, fixedNow)
    const afterSecond = sm2(afterFirst, 2, fixedNow)
    expect(afterSecond.interval).toBe(6)
    expect(afterSecond.repetitions).toBe(2)
  })

  it('third Good uses easeFactor', () => {
    let s = initialState()
    s = sm2(s, 2, fixedNow)
    s = sm2(s, 2, fixedNow)
    const before = s.easeFactor
    const r = sm2(s, 2, fixedNow)
    expect(r.interval).toBe(Math.round(6 * before))
  })

  it('Hard reduces ease more than Good, Easy increases', () => {
    const base = { interval: 6, repetitions: 2, easeFactor: 2.5 }
    const hard = sm2(base, 1, fixedNow)
    const good = sm2(base, 2, fixedNow)
    const easy = sm2(base, 3, fixedNow)
    expect(hard.easeFactor).toBeLessThan(good.easeFactor)
    expect(easy.easeFactor).toBeGreaterThan(good.easeFactor)
  })

  it('ease never drops below 1.3 after repeated Hard', () => {
    let s = initialState()
    for (let i = 0; i < 20; i++) s = sm2(s, 1, fixedNow)
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('Won intervals grow, Lost resets', () => {
    // Simulate Won (Easy) vs Lost (Again)
    let mastered = initialState()
    for (let i = 0; i < 3; i++) mastered = sm2(mastered, 3, fixedNow)
    expect(mastered.interval).toBeGreaterThan(6)

    let lost = { interval: 30, repetitions: 5, easeFactor: 2.4 }
    lost = sm2(lost, 0, fixedNow)
    expect(lost.interval).toBe(1)
    expect(lost.repetitions).toBe(0)
  })

  it('due helpers', () => {
    expect(isDue('2026-08-21', fixedNow)).toBe(true)
    expect(isDue('2026-08-22', fixedNow)).toBe(false)
    expect(daysOverdue('2026-08-18', fixedNow)).toBe(3)
    expect(daysOverdue('2026-08-22', fixedNow)).toBe(0)
  })

  it('confidenceScore favors high reps and ease, penalizes overdue', () => {
    const a = {
      repetitions: 5,
      easeFactor: 2.6,
      interval: 21,
      dueDate: '2026-08-21',
    }
    const b = {
      repetitions: 5,
      easeFactor: 2.6,
      interval: 21,
      dueDate: '2026-08-10',
    }
    expect(confidenceScore(a)).toBeGreaterThan(confidenceScore(b))
  })
})

import { describe, expect, it } from 'vitest'
import { adaptQueue, buildQueue } from '#/shared/lib/adapt'
import type { Card } from '#/shared/lib/db/dexie'

function card(overrides: Partial<Card> & { front: string }): Card {
  const { front, ...rest } = overrides
  return {
    id: Math.random().toString(36).slice(2, 8),
    front,
    back: 'B',
    topic: 'General',
    createdAt: new Date().toISOString(),
    interval: rest.interval ?? 0,
    repetitions: rest.repetitions ?? 0,
    easeFactor: rest.easeFactor ?? 2.5,
    dueDate: rest.dueDate ?? '2026-08-21',
    ...rest,
  }
}

describe('adaptQueue', () => {
  it('does not adapt when not elevated or no baseline', () => {
    const due = [card({ front: 'a', dueDate: '2026-08-20' }), card({ front: 'b' })]
    const r = adaptQueue(due, { isElevated: false, hasBaseline: true, adaptiveOptIn: true, breakMinutes: 5 })
    expect(r.shouldAdapt).toBe(false)
  })

  it('adapts when elevated and baseline ready', () => {
    const due = [
      card({ front: 'hard', repetitions: 0, easeFactor: 1.3, interval: 0, dueDate: '2026-08-21' }),
      card({ front: 'easy', repetitions: 5, easeFactor: 2.7, interval: 21, dueDate: '2026-08-21' }),
    ]
    const r = adaptQueue(due, { isElevated: true, hasBaseline: true, adaptiveOptIn: true, breakMinutes: 6 })
    expect(r.shouldAdapt).toBe(true)
    expect(r.orderedCards[0]!.front).toBe('easy') // high confidence first
    expect(r.breakMinutes).toBe(6)
  })

  it('buildQueue includes due and limited fresh', () => {
    const cs = [
      card({ front: 'due', dueDate: '2026-08-10', interval: 5, repetitions: 2 }),
      card({ front: 'future', dueDate: '2026-09-01', interval: 10, repetitions: 3 }),
      ...Array.from({ length: 10 }, (_, i) => card({ front: `new${i}`, interval: 0, repetitions: 0, dueDate: '2026-09-10' })),
    ]
    const q = buildQueue(cs as Card[], new Date('2026-08-21'))
    expect(q.some((c) => c.front === 'due')).toBe(true)
    expect(q.filter((c) => c.front.startsWith('new')).length).toBeLessThanOrEqual(5)
  })
})

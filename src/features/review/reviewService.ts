/**
 * Review service — React-independent domain orchestration.
 * Keeps SM-2, baseline, and persistence out of components (React 19 rule 11).
 */
import { db } from '#/db/dexie'
import type { Card } from '#/db/dexie'
import { sm2, type Grade } from '#/lib/sm2'
import { updateEwma, DEFAULT_ALPHA } from '#/lib/baseline'
import type { AggregatedFeatures } from '#/lib/signals'

type GradeResult = {
  nextInterval: number
  nextRepetitions: number
  nextEase: number
  nextDueDate: string
}

export function calculateNextReview(card: Card, grade: Grade, now: Date = new Date()): GradeResult {
  const r = sm2(
    { interval: card.interval, repetitions: card.repetitions, easeFactor: card.easeFactor },
    grade,
    now,
  )
  return {
    nextInterval: r.interval,
    nextRepetitions: r.repetitions,
    nextEase: r.easeFactor,
    nextDueDate: r.dueDate,
  }
}

export async function persistGrade(params: {
  card: Card
  grade: Grade
  sessionId: string
  startedAt: number
  live: AggregatedFeatures | null
}): Promise<{ nextDueDate: string }> {
  const now = new Date()
  const result = calculateNextReview(params.card, params.grade, now)

  await db.cards.update(params.card.id, {
    interval: result.nextInterval,
    repetitions: result.nextRepetitions,
    easeFactor: result.nextEase,
    dueDate: result.nextDueDate,
    lastReviewed: now.toISOString(),
  })

  await db.reviewSessions.add({
    id: crypto.randomUUID().slice(0, 8),
    cardId: params.card.id,
    sessionId: params.sessionId,
    timestamp: now.toISOString(),
    grade: params.grade,
    durationMs: Date.now() - params.startedAt,
  })

  if (params.live) {
    const features: Array<[keyof AggregatedFeatures, number]> = [
      ['interKeyLatency', params.live.interKeyLatency],
      ['dwellTime', params.live.dwellTime],
      ['correctionRate', params.live.correctionRate],
      ['wpm', params.live.wpm],
    ]
    for (const [name, value] of features) {
      const row = await db.baselineFeatures.get(name)
      if (!row) continue
      const snap = { mean: row.mean, variance: row.variance, stddev: row.stddev, sampleCount: row.sampleCount }
      const next = updateEwma(snap, value, DEFAULT_ALPHA)
      await db.baselineFeatures.put({
        name: name as never,
        mean: next.mean,
        variance: next.variance,
        stddev: next.stddev,
        sampleCount: next.sampleCount,
        lastUpdated: now.toISOString(),
      })
    }
  }

  return { nextDueDate: result.nextDueDate }
}

export async function bumpCalibration(currentN: number): Promise<number> {
  const nextN = currentN + 1
  if (nextN <= 12) {
    await db.appSettings.put({ key: 'calibrationSessions', value: JSON.stringify(nextN) })
  }
  return nextN
}

export async function maybeCreateSessionInsight(params: {
  queueLength: number
  startedAt: number
  minutesRefLength: number
  breakRec: number | null
}): Promise<void> {
  if (params.queueLength < 8) return
  const mins = Math.round((Date.now() - params.startedAt) / 60000)
  await db.insights.add({
    id: crypto.randomUUID().slice(0, 8),
    statement: `Solid ${mins}-minute session — ${params.queueLength} cards`,
    stat: `Rhythm samples: ${params.minutesRefLength} · Break rec: ${params.breakRec ?? 5}m`,
    timestamp: new Date().toISOString(),
    dismissed: false,
    kind: 'general',
  })
}

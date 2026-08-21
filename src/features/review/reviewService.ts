import type { Card } from '#/shared/lib/db/dexie'
import { sm2 } from '#/shared/lib/sm2'
import type { Grade } from '#/shared/lib/sm2'
import {
  updateEwma,
  DEFAULT_ALPHA,
} from '#/shared/lib/baseline'
import type { AggregatedFeatures } from '#/shared/lib/signals'
import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'
import { baselineRepository } from '#/shared/repositories/baselineRepository'
import { settingsRepository } from '#/shared/repositories/settingsRepository'
import { GradeSchema } from '#/features/review/schemas'

type GradeResult = {
  nextInterval: number
  nextRepetitions: number
  nextEase: number
  nextDueDate: string
}

/**
 * Calculate the next SM-2 state without touching persistence.
 */
export function calculateNextReview(
  card: Card,
  grade: Grade,
  now: Date = new Date(),
): GradeResult {
  const parsed = GradeSchema.safeParse(grade)

  if (!parsed.success) {
    throw new Error(`Invalid grade: ${grade}`)
  }

  const result = sm2(
    {
      interval: card.interval,
      repetitions: card.repetitions,
      easeFactor: card.easeFactor,
    },
    parsed.data,
    now,
  )

  return {
    nextInterval: result.interval,
    nextRepetitions: result.repetitions,
    nextEase: result.easeFactor,
    nextDueDate: result.dueDate,
  }
}

/**
 * Persist one card review.
 *
 * durationMs currently means:
 * "elapsed time since the beginning of the current study session
 * when this review was recorded."
 *
 * It is intentionally not interpreted as an individual card duration.
 */
export async function persistGrade(params: {
  card: Card
  grade: Grade
  sessionId: string
  startedAt: number
  live: AggregatedFeatures | null
}): Promise<{ nextDueDate: string }> {
  const now = new Date()

  const result = calculateNextReview(
    params.card,
    params.grade,
    now,
  )

  await cardRepository.update(params.card.id, {
    interval: result.nextInterval,
    repetitions: result.nextRepetitions,
    easeFactor: result.nextEase,
    dueDate: result.nextDueDate,
    lastReviewed: now.toISOString(),
  })

  await sessionRepository.create({
    id: crypto.randomUUID().slice(0, 8),
    cardId: params.card.id,
    sessionId: params.sessionId,
    timestamp: now.toISOString(),
    grade: params.grade,
    durationMs: Math.max(
      0,
      Date.now() - params.startedAt,
    ),
  })

  if (params.live) {
    await updateBaseline(params.live, now)
  }

  return {
    nextDueDate: result.nextDueDate,
  }
}

/**
 * Update the user's local EWMA baseline from one live signal sample.
 *
 * This remains independent from calibration-session counting.
 * A session can contain multiple signal samples.
 */
async function updateBaseline(
  live: AggregatedFeatures,
  now: Date,
): Promise<void> {
  const features: Array<
    [keyof AggregatedFeatures, number]
  > = [
    ['interKeyLatency', live.interKeyLatency],
    ['dwellTime', live.dwellTime],
    ['correctionRate', live.correctionRate],
    ['wpm', live.wpm],
  ]

  for (const [name, value] of features) {
    const row = await baselineRepository.getByName(name)

    if (!row) continue

    const next = updateEwma(
      {
        mean: row.mean,
        variance: row.variance,
        stddev: row.stddev,
        sampleCount: row.sampleCount,
      },
      value,
      DEFAULT_ALPHA,
    )

    await baselineRepository.upsert({
      name,
      mean: next.mean,
      variance: next.variance,
      stddev: next.stddev,
      sampleCount: next.sampleCount,
      lastUpdated: now.toISOString(),
    })
  }
}

/**
 * Mark ONE completed review session as one calibration session.
 *
 * Calibration is capped at five completed sessions because the
 * product's cold-start model is 3–5 sessions.
 */
export async function completeCalibrationSession(
  currentN: number,
): Promise<number> {
  const nextN = Math.min(
    Math.max(currentN, 0) + 1,
    5,
  )

  await settingsRepository.setCalibrationSessions(nextN)

  return nextN
}
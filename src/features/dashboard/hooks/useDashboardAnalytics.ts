import { useMemo } from 'react'

import {
  actionablePattern,
  retentionByTopic,
  retentionPeriodComparison,
  sessionSummaries,
} from '#/shared/lib/insights'

import { classifyLearningState } from '#/features/learning-state/domain/classifyState'

import {
  MIN_SAMPLES_FOR_BASELINE,
  peakWindow,
  zScore,
} from '#/shared/lib/baseline'

import type { BaselineMap } from '#/shared/lib/baseline'
import type {
  Card,
  ReviewSession,
  SessionSignal,
} from '#/shared/types/domain'

export type RecentActivityItem = {
  id: string
  cardFront: string
  timestamp: string
  grade: number
}

type DashboardAnalyticsInput = {
  cards: Card[]
  sessions: ReviewSession[]
  signals: SessionSignal[]
  baseline: BaselineMap
  hasBaseline: boolean
}

export function useDashboardAnalytics({
  cards,
  sessions,
  signals,
  baseline,
  hasBaseline,
}: DashboardAnalyticsInput) {
  const recentSignals = useMemo(
    () =>
      [...signals]
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime(),
        )
        .map((signal) => ({
          interKeyLatency: signal.interKeyLatency,
          dwellTime: signal.dwellTime,
          correctionRate: signal.correctionRate,
          wpm: signal.wpm,
        }))
        .slice(-12),
    [signals],
  )

  const peakLearningHour = useMemo(() => {
    if (!hasBaseline || signals.length === 0) {
      return null
    }

    const hourStats = new Map<number, number[]>()

    for (const signal of signals) {
      const hour = new Date(signal.timestamp).getHours()

      const latency = Math.abs(
        zScore(
          signal.interKeyLatency,
          baseline.interKeyLatency,
        ),
      )

      const dwell = Math.abs(
        zScore(
          signal.dwellTime,
          baseline.dwellTime,
        ),
      )

      const correction = Math.abs(
        zScore(
          signal.correctionRate,
          baseline.correctionRate,
        ),
      )

      const wpm = Math.abs(
        zScore(signal.wpm, baseline.wpm),
      )

      const deviation =
        (latency + dwell + correction + wpm) / 4

      const values = hourStats.get(hour) ?? []

      values.push(deviation)
      hourStats.set(hour, values)
    }

    return peakWindow(hourStats)
  }, [signals, baseline, hasBaseline])

  const dueToday = useMemo(() => {
    const today = new Date()
      .toISOString()
      .slice(0, 10)

    return cards.filter(
      (card) => card.dueDate <= today,
    )
  }, [cards])

  const newCards = useMemo(
    () =>
      cards.filter(
        (card) => card.repetitions === 0,
      ),
    [cards],
  )

  const retention = useMemo(
    () => retentionByTopic(cards, sessions),
    [cards, sessions],
  )

  const pattern = useMemo(
    () => actionablePattern(sessions, cards),
    [sessions, cards],
  )

  const sessionCount = useMemo(
    () =>
      new Set(
        sessions.map(
          (session) => session.sessionId,
        ),
      ).size,
    [sessions],
  )

  const recentActivity = useMemo<RecentActivityItem[]>(
    () =>
      [...sessions]
        .sort((a, b) =>
          b.timestamp.localeCompare(a.timestamp),
        )
        .slice(0, 6)
        .map((session) => ({
          id: session.id,
          cardFront:
            cards.find(
              (card) => card.id === session.cardId,
            )?.front ?? 'Card',
          timestamp: session.timestamp,
          grade: session.grade,
        })),
    [sessions, cards],
  )

  const summaries = useMemo(
    () => sessionSummaries(sessions),
    [sessions],
  )

  const retentionComparison = useMemo(
    () =>
      retentionPeriodComparison(
        sessions,
        7,
      ),
    [sessions],
  )

  const studyMinutesThisWeek = useMemo(() => {
    const weekAgo =
      Date.now() -
      7 * 24 * 60 * 60 * 1000

    return Math.round(
      summaries
        .filter(
          (session) =>
            new Date(
              session.startedAt,
            ).getTime() >= weekAgo,
        )
        .reduce(
          (total, session) =>
            total + session.durationMinutes,
          0,
        ),
    )
  }, [summaries])

  const recentReviewCount =
    retentionComparison.currentReviews

  const learningState = classifyLearningState({
    baseline,
    recent: recentSignals,
  })

  const isCalibrating = !hasBaseline

  const retentionChartData = useMemo(
    () =>
      retention
        .slice(0, 6)
        .map((item) => ({
          topic: item.topic,
          rate: Math.round(item.rate * 100),
        })),
    [retention],
  )

  const recallValue =
    retentionComparison.current === null
      ? '—'
      : `${Math.round(
          retentionComparison.current * 100,
        )}%`

  const recallHint =
    retentionComparison.delta === null
      ? 'More history needed for delta'
      : `${formatSignedPoints(
          retentionComparison.delta,
        )} vs previous 7 days`

  const calibrationProgress = useMemo(() => {
    const counts = Object.values(baseline).map(
      (snapshot) => snapshot.sampleCount,
    )

    if (counts.length === 0) {
      return 0
    }

    return Math.min(
      MIN_SAMPLES_FOR_BASELINE,
      Math.min(...counts),
    )
  }, [baseline])

  return {
    recentSignals,
    peakLearningHour,
    dueToday,
    newCards,
    retention,
    pattern,
    sessionCount,
    recentActivity,
    summaries,
    retentionComparison,
    studyMinutesThisWeek,
    recentReviewCount,
    learningState,
    isCalibrating,
    retentionChartData,
    recallValue,
    recallHint,
    calibrationProgress,
  }
}

function formatSignedPoints(delta: number): string {
  const points = Math.round(delta * 100)

  return `${points >= 0 ? '+' : ''}${points} pts`
}
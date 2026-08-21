import type {
  Card,
  ReviewSession,
} from '#/shared/lib/db/dexie'

export type RetentionByTopic = {
  topic: string
  total: number
  correct: number
  rate: number
}

export type RetentionPeriodComparison = {
  current: number | null
  previous: number | null
  delta: number | null
  currentReviews: number
  previousReviews: number
}

export type SessionSummary = {
  sessionId: string
  startedAt: string
  endedAt: string
  durationMinutes: number
  reviewCount: number
  recallRate: number
  averageGrade: number
}

/**
 * Session-level duration/performance data.
 *
 * Every value is derived from persisted ReviewSession records.
 * No synthetic observations are generated here.
 */
export type SessionLengthPerf = {
  sessionId: string
  durationMinutes: number
  reviewCount: number
  recallRate: number
  averageGrade: number
  startedAt: string
}

export type ActionablePattern = {
  text: string
  stat: string
  action: string
} | null

function isSuccessfulRecall(
  session: ReviewSession,
): boolean {
  /**
   * Circadia's grade scale is 0–3.
   * Grades 2 and 3 represent successful recall.
   */
  return session.grade >= 2
}

export function retentionByTopic(
  cards: Card[],
  sessions: ReviewSession[],
): RetentionByTopic[] {
  const topicByCardId =
    new Map(
      cards.map(
        (card) =>
          [card.id, card.topic] as const,
      ),
    )

  const groups = new Map<
    string,
    {
      total: number
      correct: number
    }
  >()

  for (const session of sessions) {
    const topic =
      topicByCardId.get(
        session.cardId,
      ) ?? 'General'

    const group =
      groups.get(topic) ?? {
        total: 0,
        correct: 0,
      }

    group.total += 1

    if (
      isSuccessfulRecall(
        session,
      )
    ) {
      group.correct += 1
    }

    groups.set(
      topic,
      group,
    )
  }

  return [...groups.entries()]
    .map(
      ([topic, group]) => ({
        topic,
        total: group.total,
        correct: group.correct,
        rate:
          group.total > 0
            ? group.correct /
              group.total
            : 0,
      }),
    )
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.rate - a.rate,
    )
}

function retentionRate(
  sessions: ReviewSession[],
): number | null {
  if (
    sessions.length === 0
  ) {
    return null
  }

  const successful =
    sessions.filter(
      isSuccessfulRecall,
    ).length

  return (
    successful /
    sessions.length
  )
}

/**
 * Compare the latest period against the immediately
 * preceding period of equal length.
 *
 * No comparison is returned unless BOTH periods contain
 * actual reviews.
 */
export function retentionPeriodComparison(
  sessions: ReviewSession[],
  periodDays = 7,
  now = new Date(),
): RetentionPeriodComparison {
  const periodMs =
    periodDays *
    24 *
    60 *
    60 *
    1000

  const nowMs =
    now.getTime()

  const currentStart =
    nowMs - periodMs

  const previousStart =
    currentStart -
    periodMs

  const currentSessions =
    sessions.filter(
      (session) => {
        const timestamp =
          new Date(
            session.timestamp,
          ).getTime()

        return (
          timestamp >=
            currentStart &&
          timestamp <=
            nowMs
        )
      },
    )

  const previousSessions =
    sessions.filter(
      (session) => {
        const timestamp =
          new Date(
            session.timestamp,
          ).getTime()

        return (
          timestamp >=
            previousStart &&
          timestamp <
            currentStart
        )
      },
    )

  const current =
    retentionRate(
      currentSessions,
    )

  const previous =
    retentionRate(
      previousSessions,
    )

  return {
    current,
    previous,
    delta:
      current !== null &&
      previous !== null
        ? current - previous
        : null,
    currentReviews:
      currentSessions.length,
    previousReviews:
      previousSessions.length,
  }
}

/**
 * Convert card-level review records into session-level summaries.
 *
 * A session's duration is taken from persisted durationMs
 * when available. Otherwise, it is derived from the actual
 * timestamps of the first and last review in that session.
 */
export function sessionSummaries(
  reviews: ReviewSession[],
): SessionSummary[] {
  const grouped =
    new Map<
      string,
      ReviewSession[]
    >()

  for (const review of reviews) {
    const group =
      grouped.get(
        review.sessionId,
      ) ?? []

    group.push(review)

    grouped.set(
      review.sessionId,
      group,
    )
  }

  return [...grouped.entries()]
    .map(
      ([
        sessionId,
        sessionReviews,
      ]) => {
        const sorted =
          [...sessionReviews].sort(
            (a, b) =>
              new Date(
                a.timestamp,
              ).getTime() -
              new Date(
                b.timestamp,
              ).getTime(),
          )

        const first =
          sorted[0]

        const last =
          sorted[
            sorted.length - 1
          ]

        if (
          !first ||
          !last
        ) {
          return null
        }

        const persistedDuration =
          Math.max(
            ...sorted.map(
              (review) =>
                review.durationMs ??
                0,
            ),
          )

        const timestampDuration =
          new Date(
            last.timestamp,
          ).getTime() -
          new Date(
            first.timestamp,
          ).getTime()

        const durationMs =
          persistedDuration >
          0
            ? persistedDuration
            : Math.max(
                0,
                timestampDuration,
              )

        const successful =
          sorted.filter(
            isSuccessfulRecall,
          ).length

        return {
          sessionId,
          startedAt:
            first.timestamp,
          endedAt:
            last.timestamp,
          durationMinutes:
            durationMs /
            60000,
          reviewCount:
            sorted.length,
          recallRate:
            successful /
            sorted.length,
          averageGrade:
            sorted.reduce(
              (
                sum,
                review,
              ) =>
                sum +
                review.grade,
              0,
            ) /
            sorted.length,
        }
      },
    )
    .filter(
      (
        summary,
      ): summary is SessionSummary =>
        summary !== null,
    )
    .sort(
      (a, b) =>
        new Date(
          b.startedAt,
        ).getTime() -
        new Date(
          a.startedAt,
        ).getTime(),
    )
}

/**
 * Return actual session duration/performance observations.
 *
 * This intentionally does NOT manufacture a trend,
 * regression line, buckets, or minimum sample set.
 *
 * Every returned observation corresponds to a real
 * persisted review session.
 */
export function sessionLengthVsPerf(
  sessions: ReviewSession[],
): SessionLengthPerf[] {
  return sessionSummaries(
    sessions,
  ).map(
    (session) => ({
      sessionId:
        session.sessionId,
      durationMinutes:
        session.durationMinutes,
      reviewCount:
        session.reviewCount,
      recallRate:
        session.recallRate,
      averageGrade:
        session.averageGrade,
      startedAt:
        session.startedAt,
    }),
  )
}

/**
 * Produce one conservative actionable insight.
 *
 * Requirements:
 * - At least 10 review observations.
 * - At least two topics with 5 observations each.
 * - At least a 15 percentage-point difference.
 *
 * If those conditions aren't satisfied, return null.
 */
export function actionablePattern(
  sessions: ReviewSession[],
  cards: Card[],
): ActionablePattern {
  if (
    sessions.length < 10
  ) {
    return null
  }

  const topics =
    retentionByTopic(
      cards,
      sessions,
    ).filter(
      (topic) =>
        topic.total >= 5,
    )

  if (
    topics.length < 2
  ) {
    return null
  }

  const strongest =
    [...topics].sort(
      (a, b) =>
        b.rate - a.rate,
    )[0]

  const weakest =
    [...topics].sort(
      (a, b) =>
        a.rate - b.rate,
    )[0]

  if (
    !strongest ||
    !weakest
  ) {
    return null
  }

  const difference =
    strongest.rate -
    weakest.rate

  if (
    difference < 0.15
  ) {
    return null
  }

  return {
    text:
      `Your recall is currently strongest in ${strongest.topic}.`,
    stat:
      `${Math.round(
        strongest.rate * 100,
      )}% recall there versus ` +
      `${Math.round(
        weakest.rate * 100,
      )}% in ${weakest.topic}.`,
    action:
      `A short ${weakest.topic} review could help strengthen that gap.`,
  }
}
import type { Card } from '#/shared/types/domain'
import type { AggregatedFeatures } from '#/shared/lib/signals'

import { GradeSchema } from './schemas'
import { submitReview } from './application/submitReview'

export async function submitGradeAction(params: {
  card: Card
  grade: number
  sessionId: string
  startedAt: number
  live: AggregatedFeatures | null
}) {
  const grade = GradeSchema.parse(params.grade)

  return submitReview({
    card: params.card,
    grade,
    sessionId: params.sessionId,
    startedAt: params.startedAt,
    live: params.live,
  })
}
import { GradeSchema } from './schemas'
import { persistGrade as servicePersistGrade } from './reviewService'
import type { Card } from '#/shared/lib/db/dexie'
import type { AggregatedFeatures } from '#/shared/lib/signals'

// Actions — React 19 mutations (Guide §18, §19)
// Thin: validate → service → domain → repository. No SQL here.

export async function submitGradeAction(params: {
  card: Card
  grade: number
  sessionId: string
  startedAt: number
  live: AggregatedFeatures | null
}) {
  const parsedGrade = GradeSchema.parse(params.grade)
  return servicePersistGrade({
    card: params.card,
    grade: parsedGrade,
    sessionId: params.sessionId,
    startedAt: params.startedAt,
    live: params.live,
  })
}

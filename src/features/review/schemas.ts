import { z } from 'zod'

export const GradeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
])

export const SubmitGradeSchema = z.object({
  cardId: z.string().min(1),
  grade: GradeSchema,
  sessionId: z.string().min(1),
})

export type SubmitGradeInput = z.infer<typeof SubmitGradeSchema>

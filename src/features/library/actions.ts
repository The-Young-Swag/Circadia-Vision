import { z } from 'zod'

import { cardRepository } from '#/shared/repositories/cardRepository'
import type { Card } from '#/shared/types/domain'

const CardInputSchema = z.object({
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
  topic: z.string().trim().default('General'),
  targetDate: z.string().optional(),
})

export async function createCardAction(input: {
  front: string
  back: string
  topic?: string
  targetDate?: string
}): Promise<Card> {
  const data = CardInputSchema.parse(input)
  const now = new Date().toISOString()

  const card: Card = {
    id: crypto.randomUUID().slice(0, 8),
    front: data.front,
    back: data.back,
    topic: data.topic || 'General',
    targetDate: data.targetDate,
    createdAt: now,
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: now.slice(0, 10),
  }

  await cardRepository.create(card)

  return card
}

export async function updateCardAction(
  id: string,
  patch: Partial<Card>,
): Promise<void> {
  await cardRepository.update(id, patch)
}

export async function deleteCardAction(id: string): Promise<void> {
  await cardRepository.delete(id)
}
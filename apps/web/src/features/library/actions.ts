import { z } from 'zod'
import { cardRepository } from '#/shared/repositories/cardRepository'
import type { Card } from '#/shared/lib/db/dexie'

const CardInputSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  topic: z.string().default('General'),
  targetDate: z.string().optional(),
})

// Thin action — validate then repository (Guide §23)
export async function createCardAction(input: { front: string; back: string; topic?: string; targetDate?: string }) {
  const data = CardInputSchema.parse(input)
  const now = new Date().toISOString()
  const card: Card = {
    id: crypto.randomUUID().slice(0, 8),
    front: data.front.trim(),
    back: data.back.trim(),
    topic: data.topic.trim() || 'General',
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

export async function updateCardAction(id: string, patch: Partial<Card>) {
  await cardRepository.update(id, patch)
}

export async function deleteCardAction(id: string) {
  await cardRepository.delete(id)
}

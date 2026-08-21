import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'
import { buildQueue } from '#/shared/lib/adapt'

// Queries — authoritative data-loading path (Guide §47)
// Route loader or hook calls these, not db directly

export async function getDueCards() {
  const cards = await cardRepository.findAll()
  return buildQueue(cards)
}

export async function getAllCards() {
  return cardRepository.findAll()
}

export async function getAllSessions() {
  return sessionRepository.findAll()
}

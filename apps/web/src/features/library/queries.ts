import { cardRepository } from '#/shared/repositories/cardRepository'

export async function getLibraryCards() {
  return cardRepository.findAll()
}

export async function searchLibraryCards(q: string) {
  const all = await cardRepository.findAll()
  const needle = q.trim().toLowerCase()
  if (!needle) return all
  return all.filter((c) => c.front.toLowerCase().includes(needle) || c.back.toLowerCase().includes(needle) || c.topic.toLowerCase().includes(needle))
}

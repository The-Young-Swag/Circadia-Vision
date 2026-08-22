import { cardRepository } from '#/shared/repositories/cardRepository'

export async function getLibraryCards() {
  return cardRepository.findAll()
}
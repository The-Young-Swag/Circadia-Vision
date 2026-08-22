import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'
import {
  actionablePattern,
  retentionByTopic,
  sessionLengthVsPerf,
} from '#/shared/lib/insights'

export async function getInsights() {
  const [cards, sessions] = await Promise.all([
    cardRepository.findAll(),
    sessionRepository.findAll(),
  ])

  return {
    cards,
    sessions,
    retention: retentionByTopic(cards, sessions),
    lengthPerf: sessionLengthVsPerf(sessions),
    pattern: actionablePattern(sessions, cards),
  }
}
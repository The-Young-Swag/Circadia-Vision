import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'
import { retentionByTopic, sessionLengthVsPerf, actionablePattern } from '#/shared/lib/insights'

// Single authoritative data path for dashboard (Guide §47)
export async function getDashboardInsights() {
  const [cards, sessions] = await Promise.all([cardRepository.findAll(), sessionRepository.findAll()])
  return {
    cards,
    sessions,
    retention: retentionByTopic(cards, sessions),
    lengthPerf: sessionLengthVsPerf(sessions),
    pattern: actionablePattern(sessions, cards),
  }
}

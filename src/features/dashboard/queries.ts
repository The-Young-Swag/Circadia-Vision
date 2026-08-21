import { cardRepository } from '#/repositories/cardRepository'
import { sessionRepository } from '#/repositories/sessionRepository'
import { retentionByTopic, sessionLengthVsPerf, actionablePattern } from '#/lib/insights'

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

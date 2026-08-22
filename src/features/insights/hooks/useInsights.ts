import {
  useEffect,
  useState,
} from 'react'

import {
  actionablePattern,
  retentionByTopic,
  sessionLengthVsPerf,
} from '#/shared/lib/insights'

import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'

type InsightsData = {
  cards: Awaited<
    ReturnType<typeof cardRepository.findAll>
  >
  sessions: Awaited<
    ReturnType<typeof sessionRepository.findAll>
  >
  retention: ReturnType<typeof retentionByTopic>
  lengthPerf: ReturnType<typeof sessionLengthVsPerf>
  pattern: ReturnType<typeof actionablePattern>
}

export function useInsights() {
  const [data, setData] =
    useState<InsightsData | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadInsights() {
      try {
        const [cards, sessions] =
          await Promise.all([
            cardRepository.findAll(),
            sessionRepository.findAll(),
          ])

        const nextData: InsightsData = {
          cards,
          sessions,
          retention: retentionByTopic(
            cards,
            sessions,
          ),
          lengthPerf:
            sessionLengthVsPerf(sessions),
          pattern: actionablePattern(
            sessions,
            cards,
          ),
        }

        if (!cancelled) {
          setData(nextData)
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to load insights:',
            error,
          )
        }
      }
    }

    void loadInsights()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    data,
  }
}
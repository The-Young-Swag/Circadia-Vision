import {
  useEffect,
  useState,
} from 'react'
import { liveQuery } from 'dexie'

import type {
  Card,
  ReviewSession,
  SessionSignal,
} from '#/shared/types/domain'

import { seedIfEmpty } from '#/shared/lib/db/seed'

import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'
import { signalRepository } from '#/shared/repositories/signalRepository'
import { settingsRepository } from '#/shared/repositories/settingsRepository'

type DashboardData = {
  cards: Card[]
  sessions: ReviewSession[]
  signals: SessionSignal[]
  optIn: boolean | null
}

const EMPTY_DATA: DashboardData = {
  cards: [],
  sessions: [],
  signals: [],
  optIn: null,
}

export function useDashboardData() {
  const [data, setData] =
    useState<DashboardData>(EMPTY_DATA)

  const [ready, setReady] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        await seedIfEmpty()

        if (cancelled) {
          return
        }

        const observable = liveQuery(
          async (): Promise<DashboardData> => {
            const [
              cards,
              sessions,
              signals,
              optIn,
            ] = await Promise.all([
              cardRepository.findAll(),
              sessionRepository.findAll(),
              signalRepository.findRecent(100),
              settingsRepository.getAdaptiveOptIn(),
            ])

            return {
              cards,
              sessions,
              signals,
              optIn,
            }
          },
        )

        const subscription =
          observable.subscribe({
            next: (nextData) => {
              if (cancelled) {
                return
              }

              setData(nextData)
              setReady(true)
            },

            error: (error) => {
              if (cancelled) {
                return
              }

              console.error(
                'Failed to observe dashboard data:',
                error,
              )

              setReady(true)
            },
          })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          'Failed to initialize dashboard data:',
          error,
        )

        setReady(true)
      }
    }

    let cleanup:
      | (() => void)
      | undefined

    void initialize().then(
      (unsubscribe) => {
        cleanup = unsubscribe
      },
    )

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  const setOptIn = async (
    value: boolean,
  ) => {
    await settingsRepository.setAdaptiveOptIn(
      value,
    )
  }

  return {
    cards: data.cards,
    sessions: data.sessions,
    signals: data.signals,
    ready,
    optIn: data.optIn,
    setOptIn,
  }
}
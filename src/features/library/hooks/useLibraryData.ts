import {
  useEffect,
  useState,
} from 'react'
import { liveQuery } from 'dexie'

import type { Card } from '#/shared/types/domain'

import { seedIfEmpty } from '#/shared/lib/db/seed'
import { cardRepository } from '#/shared/repositories/cardRepository'

export function useLibraryData() {
  const [cards, setCards] =
    useState<Card[]>([])

  const [ready, setReady] =
    useState(false)

  useEffect(() => {
    let cancelled = false
    let unsubscribe:
      | (() => void)
      | undefined

    async function initialize() {
      try {
        await seedIfEmpty()

        if (cancelled) {
          return
        }

        const observable = liveQuery(
          () => cardRepository.findAll(),
        )

        const subscription =
          observable.subscribe({
            next: (nextCards) => {
              if (cancelled) {
                return
              }

              setCards(nextCards)
              setReady(true)
            },

            error: (error) => {
              if (cancelled) {
                return
              }

              console.error(
                'Failed to observe library data:',
                error,
              )

              setReady(true)
            },
          })

        unsubscribe = () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        console.error(
          'Failed to initialize library data:',
          error,
        )

        setReady(true)
      }
    }

    void initialize()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return {
    cards,
    ready,
  }
}
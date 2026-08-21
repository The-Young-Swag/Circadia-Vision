/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useState } from 'react'
import type { Card, ReviewSession } from '#/shared/lib/db/dexie'
import { seedIfEmpty } from '#/shared/lib/db/seed'
import { cardRepository } from '#/shared/repositories/cardRepository'
import { sessionRepository } from '#/shared/repositories/sessionRepository'
import { settingsRepository } from '#/shared/repositories/settingsRepository'

// Custom Hook — reusable React behavior (rule 13)
// Encapsulates sync with external system (Dexie) — correct useEffect usage
export function useDashboardData() {
  const [cards, setCards] = useState<Card[]>([])
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const [ready, setReady] = useState(false)
  const [optIn, setOptIn] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    seedIfEmpty().then(() => {
      void refresh()
      if (!cancelled) setReady(true)
    })

    async function refresh() {
      const [c, s] = await Promise.all([
        cardRepository.findAll(),
        sessionRepository.findAll(),
      ])
      if (cancelled) return
      setCards(c)
      setSessions(s)
      const v = await settingsRepository.getAdaptiveOptIn()
      if (cancelled) return
      setOptIn(v)
    }

    const id = setInterval(() => {
      void refresh()
    }, 2000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const setOptInAndPersist = async (value: boolean) => {
    await settingsRepository.setAdaptiveOptIn(value)
    setOptIn(value)
  }

  return { cards, sessions, ready, optIn, setOptIn: setOptInAndPersist }
}

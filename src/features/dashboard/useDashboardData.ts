import { useEffect, useState } from 'react'
import { db, type Card, type ReviewSession } from '#/db/dexie'
import { seedIfEmpty } from '#/db/seed'

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
      const [c, s] = await Promise.all([db.cards.toArray(), db.reviewSessions.toArray()])
      if (cancelled) return
      setCards(c)
      setSessions(s)
      const v = await db.appSettings.get('adaptiveOptIn')
      if (cancelled) return
      setOptIn(v ? (JSON.parse(v.value) as boolean) : null)
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
    await db.appSettings.put({ key: 'adaptiveOptIn', value: JSON.stringify(value) })
    setOptIn(value)
  }

  return { cards, sessions, ready, optIn, setOptIn: setOptInAndPersist }
}

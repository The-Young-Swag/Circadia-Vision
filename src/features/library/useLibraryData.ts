import { useCallback, useEffect, useState } from 'react'
import { db, type Card } from '#/db/dexie'

// Reusable React behavior: sync with external store (Dexie)
// Keeps data infrastructure out of the UI component (rule 20)
export function useLibraryData() {
  const [cards, setCards] = useState<Card[]>([])

  const refresh = useCallback(async () => {
    setCards(await db.cards.toArray())
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 1500)
    return () => clearInterval(id)
  }, [refresh])

  return { cards, refresh }
}

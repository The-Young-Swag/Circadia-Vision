import { useCallback, useEffect, useState } from 'react'
import type { Card } from '#/db/dexie'
import { cardRepository } from '#/repositories/cardRepository'

// Reusable React behavior: sync with external store (Dexie)
// Keeps data infrastructure out of the UI component (rule 20)
export function useLibraryData() {
  const [cards, setCards] = useState<Card[]>([])

  const refresh = useCallback(async () => {
    setCards(await cardRepository.findAll())
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), 1500)
    return () => clearInterval(id)
  }, [refresh])

  return { cards, refresh }
}

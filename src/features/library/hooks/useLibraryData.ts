import { useCallback, useEffect, useState } from 'react'

import type { Card } from '#/shared/types/domain'

import { getLibraryCards } from '#/features/library/queries'

export function useLibraryData() {
  const [cards, setCards] = useState<Card[]>([])

  const refresh = useCallback(async () => {
    const nextCards = await getLibraryCards()
    setCards(nextCards)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    cards,
    refresh,
  }
}
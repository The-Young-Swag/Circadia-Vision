import {
  useCallback,
  useEffect,
  useState,
} from 'react'

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

export function useDashboardData() {
  const [cards, setCards] =
    useState<Card[]>([])

  const [sessions, setSessions] =
    useState<ReviewSession[]>([])

  const [signals, setSignals] =
    useState<SessionSignal[]>([])

  const [ready, setReady] =
    useState(false)

  const [optIn, setOptIn] =
    useState<boolean | null>(null)

  const refresh =
    useCallback(async () => {
      const [
        nextCards,
        nextSessions,
        nextSignals,
        adaptiveOptIn,
      ] = await Promise.all([
        cardRepository.findAll(),
        sessionRepository.findAll(),
        signalRepository.findRecent(100),
        settingsRepository.getAdaptiveOptIn(),
      ])

      setCards(nextCards)
      setSessions(nextSessions)
      setSignals(nextSignals)
      setOptIn(adaptiveOptIn)
    }, [])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        await seedIfEmpty()

        if (cancelled) return

        await refresh()

        setReady(true)
      } catch (error) {
        console.error(
          'Failed to initialize dashboard data:',
          error,
        )

        setReady(true)
      }
    }

    void initialize()

    const intervalId =
      window.setInterval(() => {
        if (!cancelled) {
          void refresh()
        }
      }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(
        intervalId,
      )
    }
  }, [refresh])

  const setOptInAndPersist =
    async (value: boolean) => {
      await settingsRepository.setAdaptiveOptIn(
        value,
      )

      setOptIn(value)
    }

  return {
    cards,
    sessions,
    signals,
    ready,
    optIn,
    setOptIn:
      setOptInAndPersist,
    refresh,
  }
}
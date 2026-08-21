/**
 * Adaptation actions — pure logic.
 * When elevated load is sustained, we:
 * - shift queue toward high-confidence cards
 * - suggest a break sized from historical recovery
 * - disclose why
 */

import { confidenceScore } from '#/shared/lib/sm2'
import type { Card } from '#/shared/types/domain'

export type Adaptation = {
  shouldAdapt: boolean
  reason: string | null
  orderedCards: Card[]
  breakMinutes: number | null
}

export function adaptQueue(
  dueCards: Card[],
  opts: {
    isElevated: boolean
    hasBaseline: boolean
    adaptiveOptIn: boolean
    breakMinutes: number | null
  },
): Adaptation {
  if (!opts.adaptiveOptIn || !opts.hasBaseline || !opts.isElevated) {
    // No adaptation — return due order (soonest due first, then random)
    return {
      shouldAdapt: false,
      reason: null,
      orderedCards: [...dueCards].sort((a, b) =>
        a.dueDate.localeCompare(b.dueDate),
      ),
      breakMinutes: null,
    }
  }

  // Elevated: sort by confidence descending (easy first), but keep due cards only
  const ordered = [...dueCards].sort(
    (a, b) => confidenceScore(b) - confidenceScore(a),
  )

  return {
    shouldAdapt: true,
    reason:
      'Your rhythm suggests elevated load — showing mastered material first. A short break may help.',
    orderedCards: ordered,
    breakMinutes: opts.breakMinutes,
  }
}

/**
 * Queue for review: due + new + overdue, with caps.
 * - `due` first, then `new` (never reviewed), then `overdue` already in due
 * In adaptive mode we reorder via adaptQueue.
 */
export function buildQueue(cards: Card[], now: Date = new Date()): Card[] {
  const today = now.toISOString().slice(0, 10)
  const due = cards.filter((c) => c.dueDate <= today)
  const fresh = cards.filter(
    (c) => c.repetitions === 0 && c.interval === 0 && !due.includes(c),
  )
  // simple interleaving: due first, then fresh up to 5
  return [...due, ...fresh.slice(0, 5)]
}

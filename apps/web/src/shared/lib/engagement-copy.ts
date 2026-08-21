/**
 * Centralized copy rules per Brief §2 — delta-first, gain-framed, second-person.
 * Keeps engagement principles enforceable in one place.
 */

// Delta over snapshot — never "Retention: 78%", always "up 9% this month"
export function formatDelta(current: number, previous: number | null): string | null {
  if (previous === null || previous === 0) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.005) return 'steady vs last period'
  const sign = diff > 0 ? '+' : ''
  return `${sign}${Math.round(diff * 100)}% vs last period`
}

export function formatDeltaPercent(currentRate: number, previousRate: number | null): string {
  const delta = formatDelta(currentRate, previousRate)
  if (!delta) return `${Math.round(currentRate * 100)}% retained`
  const arrow = currentRate > (previousRate ?? 0) ? '↑' : currentRate < (previousRate ?? 0) ? '↓' : '→'
  return `${Math.round(currentRate * 100)}% ${arrow} ${delta}`
}

// Gain-framing — "lock in what you've learned" not "you'll forget"
export function gainFrameRetention(topic: string, rate: number, _remaining?: number): string {
  if (rate < 0.65) {
    return `${topic} is your quickest win — ${Math.round(rate * 100)}% now. A focused review will lock it in.`
  }
  if (rate < 0.85) {
    return `${topic} is solid at ${Math.round(rate * 100)}% — keep it that way with a light review.`
  }
  return `${topic} is strong at ${Math.round(rate * 100)}% — well done.`
}

export function gainFrameDue(cardsDue: number): string {
  if (cardsDue === 0) return 'All caught up — well done. New material is ready when you are.'
  if (cardsDue < 10) return `You have ${cardsDue} cards due — a short session will keep momentum.`
  return `You have ${cardsDue} cards due. Your rhythm suggests a focused 15-minute block.`
}

// Second-person, personal-discovery voice — "You tend to..." not "Our algorithm..."
export function secondPersonPeakWindow(hour: number | null): string | null {
  if (hour === null) return null
  const next = hour === 23 ? 0 : hour + 1
  const fmt = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`
  return `You tend to be sharpest around ${fmt(hour)}–${fmt(next)}.`
}

export function secondPersonRecovery(minutes: number): string {
  return `You usually return to baseline after ~${Math.round(minutes)} minutes.`
}

// Ownership cue — factual, unranked, no loss state
export function ownershipCue(sessionCount: number): string {
  if (sessionCount < 5) return `Learning your rhythm — ${sessionCount} of 5 sessions`
  return `Learned from ${sessionCount} of your sessions`
}

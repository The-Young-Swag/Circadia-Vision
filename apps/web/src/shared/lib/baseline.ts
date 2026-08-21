/**
 * EWMA baseline — personal-only, statistical v1.
 * Zero deps, runs on device, updates after every session.
 *
 * For each feature we maintain EWMA mean and variance.
 * Live sample z = (x - mean) / stddev.
 * Elevated load if |z| > threshold sustained for window.
 */

import type { FeatureName } from '#/shared/lib/db/dexie'

export type BaselineSnapshot = {
  mean: number
  variance: number
  stddev: number
  sampleCount: number
}

export type BaselineMap = Record<FeatureName, BaselineSnapshot>

export const DEFAULT_ALPHA = 0.15 // smoothing; lower = slower adaptation
export const DEFAULT_THRESHOLD = 1.6 // z-score threshold
export const DEFAULT_SUSTAINED_WINDOW = 3 // consecutive minutes above threshold
export const MIN_SAMPLES_FOR_BASELINE = 5 // per feature before adaptation

export function createEmptyBaseline(): BaselineMap {
  return {
    interKeyLatency: emptySnap(),
    dwellTime: emptySnap(),
    correctionRate: emptySnap(),
    wpm: emptySnap(),
  }
}

function emptySnap(): BaselineSnapshot {
  return { mean: 0, variance: 0, stddev: 1, sampleCount: 0 }
}

/**
 * Update EWMA with a new aggregated sample (e.g., per-minute mean).
 * Uses Welford-style EWMA for variance.
 */
export function updateEwma(
  prev: BaselineSnapshot,
  value: number,
  alpha = DEFAULT_ALPHA,
): BaselineSnapshot {
  if (prev.sampleCount === 0) {
    return {
      mean: value,
      variance: 0,
      stddev: 1, // avoid div-by-zero until we have spread
      sampleCount: 1,
    }
  }
  const mean = alpha * value + (1 - alpha) * prev.mean
  // EWMA variance: E[(x - mean)^2]
  const delta = value - prev.mean
  const variance = alpha * delta * delta + (1 - alpha) * prev.variance
  const stddev = Math.sqrt(variance) || 1
  return { mean, variance, stddev, sampleCount: prev.sampleCount + 1 }
}

export function zScore(value: number, snap: BaselineSnapshot): number {
  if (snap.sampleCount < 2) return 0
  return (value - snap.mean) / (snap.stddev || 1)
}

export function hasBaseline(baseline: BaselineMap): boolean {
  return Object.values(baseline).every(
    (s) => s.sampleCount >= MIN_SAMPLES_FOR_BASELINE,
  )
}

/**
 * Determine elevated load from a sliding window of per-minute feature vectors.
 * Returns true if >= threshold features are elevated, sustained.
 *
 * For fatigue we expect:
 * - interKeyLatency ↑ (positive z)
 * - dwellTime ↑ (positive z)
 * - correctionRate ↑ (positive z)
 * - wpm ↓ (negative z)
 *
 * We treat wpm inverted: z < -threshold counts as elevated.
 */
export function isElevatedLoad(
  window: Array<Record<FeatureName, number>>,
  baseline: BaselineMap,
  opts: {
    threshold?: number
    sustained?: number
    requiredFeatures?: number
  } = {},
): boolean {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD
  const sustained = opts.sustained ?? DEFAULT_SUSTAINED_WINDOW
  const required = opts.requiredFeatures ?? 2

  if (window.length < sustained) return false
  if (!hasBaseline(baseline)) return false

  // Check last `sustained` minutes
  const recent = window.slice(-sustained)
  for (const minute of recent) {
    let elevatedCount = 0
    for (const f of Object.keys(baseline) as FeatureName[]) {
      const z = zScore(minute[f], baseline[f])
      if (f === 'wpm') {
        if (z < -threshold) elevatedCount++
      } else {
        if (z > threshold) elevatedCount++
      }
    }
    if (elevatedCount < required) return false
  }
  return true
}

/**
 * Recommend break length from historical recovery pattern.
 * `recoveries` are minutes-to-baseline after past breaks.
 * Returns median recovery, clamped to [2, 15] minutes.
 */
export function recommendBreakMinutes(recoveries: number[]): number {
  if (recoveries.length === 0) return 5
  const sorted = [...recoveries].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!
  return Math.max(2, Math.min(15, Math.round(median)))
}

/**
 * Peak window — hour of day (0-23) with smallest mean deviation.
 * `hourStats` is map hour -> array of abs(z) samples.
 */
export function peakWindow(hourStats: Map<number, number[]>): number | null {
  if (hourStats.size === 0) return null
  let bestHour: number | null = null
  let bestMean = Infinity
  for (const [hour, vals] of hourStats) {
    if (vals.length < 5) continue // need enough samples
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    if (mean < bestMean) {
      bestMean = mean
      bestHour = hour
    }
  }
  return bestHour
}

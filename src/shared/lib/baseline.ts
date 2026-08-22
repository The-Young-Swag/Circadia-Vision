import type { FeatureName } from '#/shared/types/domain'

export type BaselineSnapshot = {
  mean: number
  variance: number
  stddev: number
  sampleCount: number
}

export type BaselineMap = Record<
  FeatureName,
  BaselineSnapshot
>

export const DEFAULT_ALPHA = 0.15
export const DEFAULT_THRESHOLD = 1.6
export const DEFAULT_SUSTAINED_WINDOW = 3
export const MIN_SAMPLES_FOR_BASELINE = 5

export function createEmptyBaseline(): BaselineMap {
  return {
    interKeyLatency: emptySnap(),
    dwellTime: emptySnap(),
    correctionRate: emptySnap(),
    wpm: emptySnap(),
  }
}

function emptySnap(): BaselineSnapshot {
  return {
    mean: 0,
    variance: 0,
    stddev: 1,
    sampleCount: 0,
  }
}

/**
 * Update an EWMA baseline with one aggregated sample.
 *
 * The first valid sample establishes the initial mean.
 * Subsequent samples update both mean and variance.
 */
export function updateEwma(
  prev: BaselineSnapshot,
  value: number,
  alpha = DEFAULT_ALPHA,
): BaselineSnapshot {
  if (!Number.isFinite(value)) {
    return prev
  }

  const safeAlpha = Math.min(
    1,
    Math.max(0.001, alpha),
  )

  if (prev.sampleCount === 0) {
    return {
      mean: value,
      variance: 0,
      stddev: 1,
      sampleCount: 1,
    }
  }

  const mean =
    safeAlpha * value +
    (1 - safeAlpha) * prev.mean

  const delta =
    value - prev.mean

  const variance =
    safeAlpha * delta * delta +
    (1 - safeAlpha) *
      prev.variance

  const stddev =
    Math.sqrt(
      Math.max(0, variance),
    ) || 1

  return {
    mean,
    variance,
    stddev,
    sampleCount:
      prev.sampleCount + 1,
  }
}

/**
 * Convert a value to its distance from the personal baseline.
 *
 * A z-score of:
 *   0   = exactly at baseline
 *   +1  = one standard deviation above
 *   -1  = one standard deviation below
 */
export function zScore(
  value: number,
  snap: BaselineSnapshot,
): number {
  if (
    !Number.isFinite(value) ||
    snap.sampleCount < 2
  ) {
    return 0
  }

  return (
    (value - snap.mean) /
    (snap.stddev || 1)
  )
}

/**
 * A personal baseline is considered usable only when
 * every tracked feature has enough observations.
 */
export function hasBaseline(
  baseline: BaselineMap,
): boolean {
  return Object.values(baseline).every(
    (snapshot) =>
      snapshot.sampleCount >=
      MIN_SAMPLES_FOR_BASELINE,
  )
}

/**
 * Determine elevated cognitive/load state from a sliding
 * window of per-minute feature vectors.
 *
 * Fatigue direction:
 *
 *   interKeyLatency ↑
 *   dwellTime       ↑
 *   correctionRate  ↑
 *   wpm              ↓
 *
 * At least `requiredFeatures` must be elevated for every
 * sample in the sustained window.
 */
export function isElevatedLoad(
  window: Array<
    Record<FeatureName, number>
  >,
  baseline: BaselineMap,
  opts: {
    threshold?: number
    sustained?: number
    requiredFeatures?: number
  } = {},
): boolean {
  const threshold =
    opts.threshold ??
    DEFAULT_THRESHOLD

  const sustained =
    opts.sustained ??
    DEFAULT_SUSTAINED_WINDOW

  const required =
    opts.requiredFeatures ?? 2

  if (
    window.length < sustained ||
    !hasBaseline(baseline)
  ) {
    return false
  }

  const recent =
    window.slice(-sustained)

  for (const minute of recent) {
    let elevatedCount = 0

    for (
      const feature of
        Object.keys(
          baseline,
        ) as FeatureName[]
    ) {
      const value =
        minute[feature]

      if (!Number.isFinite(value)) {
        continue
      }

      const z =
        zScore(
          value,
          baseline[feature],
        )

      if (
        feature === 'wpm'
      ) {
        if (
          z < -threshold
        ) {
          elevatedCount++
        }
      } else if (
        z > threshold
      ) {
        elevatedCount++
      }
    }

    if (
      elevatedCount <
      required
    ) {
      return false
    }
  }

  return true
}

/**
 * Recommend a break length from actual historical
 * recovery observations.
 *
 * Returns null when there is no personal recovery
 * history. This is intentional: a generic fallback
 * should not be presented as a personalized recommendation.
 *
 * `recoveries` = minutes required to return to baseline
 * after previous breaks.
 */
export function recommendBreakMinutes(
  recoveries: number[],
): number | null {
  const validRecoveries =
    recoveries.filter(
      (value) =>
        Number.isFinite(
          value,
        ) &&
        value > 0,
    )

  if (
    validRecoveries.length === 0
  ) {
    return null
  }

  const sorted =
    [...validRecoveries].sort(
      (a, b) => a - b,
    )

  const mid =
    Math.floor(
      sorted.length / 2,
    )

  const median =
    sorted.length % 2 === 0
      ? (
          sorted[mid - 1] +
          sorted[mid]
        ) / 2
      : sorted[mid]

  return Math.max(
    2,
    Math.min(
      15,
      Math.round(median),
    ),
  )
}

/**
 * Find the hour of day with the smallest mean
 * absolute deviation from the personal baseline.
 *
 * Each hour needs at least five observations.
 *
 * Returns null when no hour has sufficient evidence.
 */
export function peakWindow(
  hourStats: Map<
    number,
    number[]
  >,
): number | null {
  if (
    hourStats.size === 0
  ) {
    return null
  }

  let bestHour:
    | number
    | null = null

  let bestMean =
    Infinity

  for (
    const [
      hour,
      values,
    ] of hourStats
  ) {
    if (
      hour < 0 ||
      hour > 23 ||
      values.length < 5
    ) {
      continue
    }

    const validValues =
      values.filter(
        (value) =>
          Number.isFinite(
            value,
          ) &&
          value >= 0,
      )

    if (
      validValues.length < 5
    ) {
      continue
    }

    const mean =
      validValues.reduce(
        (total, value) =>
          total + value,
        0,
      ) /
      validValues.length

    if (
      mean < bestMean
    ) {
      bestMean = mean
      bestHour = hour
    }
  }

  return bestHour
}
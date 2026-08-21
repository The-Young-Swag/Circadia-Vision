import {
  hasBaseline as checkHasBaseline,
  isElevatedLoad,
  zScore,
} from '#/shared/lib/baseline'

import type {
  BaselineMap,
} from '#/shared/lib/baseline'

import type {
  AggregatedFeatures,
} from '#/shared/lib/signals'

export type LearningState =
  | 'Sharp'
  | 'Steady'
  | 'Warming Down'
  | 'Recovering'
  | 'Insufficient Signal'

type ClassifyInput = {
  baseline: BaselineMap
  recent: AggregatedFeatures[]
  previousState?: LearningState
}

const SHARP_Z_THRESHOLD = 0.75
const MIN_SHARP_OBSERVATIONS = 3

export function classifyLearningState({
  baseline,
  recent,
  previousState,
}: ClassifyInput): {
  state: LearningState
  reason: string
} {
  if (!checkHasBaseline(baseline)) {
    return {
      state: 'Insufficient Signal',
      reason:
        'Not enough personal signal yet. Standard scheduling is being used while Circadia learns your rhythm.',
    }
  }

  if (recent.length === 0) {
    return {
      state: 'Steady',
      reason:
        'Your personal baseline is ready. Start a review to see your current rhythm.',
    }
  }

  const elevated =
    isElevatedLoad(
      recent,
      baseline,
    )

  if (
    previousState === 'Warming Down' &&
    !elevated &&
    recent.length >= 2
  ) {
    return {
      state: 'Recovering',
      reason:
        'Your recent rhythm is moving back toward your personal baseline.',
    }
  }

  if (elevated) {
    return {
      state: 'Warming Down',
      reason:
        'Your recent timing pattern has moved outside your usual range.',
    }
  }

  /**
   * Sharp means the recent observations are consistently
   * better than baseline across multiple relevant dimensions.
   *
   * For latency/dwell/correction:
   * lower is better.
   *
   * For WPM:
   * higher is better.
   */
  if (
    recent.length >=
    MIN_SHARP_OBSERVATIONS
  ) {
    const recentWindow =
      recent.slice(
        -MIN_SHARP_OBSERVATIONS,
      )

    const sharpObservations =
      recentWindow.filter(
        (sample) => {
          const latencyZ =
            zScore(
              sample.interKeyLatency,
              baseline.interKeyLatency,
            )

          const dwellZ =
            zScore(
              sample.dwellTime,
              baseline.dwellTime,
            )

          const correctionZ =
            zScore(
              sample.correctionRate,
              baseline.correctionRate,
            )

          const wpmZ =
            zScore(
              sample.wpm,
              baseline.wpm,
            )

          const positiveSignals =
            [
              latencyZ < -SHARP_Z_THRESHOLD,
              dwellZ < -SHARP_Z_THRESHOLD,
              correctionZ <
                -SHARP_Z_THRESHOLD,
              wpmZ >
                SHARP_Z_THRESHOLD,
            ].filter(Boolean)
              .length

          return positiveSignals >= 2
        },
      ).length

    if (
      sharpObservations >=
      MIN_SHARP_OBSERVATIONS
    ) {
      return {
        state: 'Sharp',
        reason:
          'Your recent timing pattern is consistently stronger than your personal baseline.',
      }
    }
  }

  return {
    state: 'Steady',
    reason:
      'Your recent timing pattern is within your usual range.',
  }
}

export function stateLabel(
  state: LearningState,
): string {
  return state
}

export function stateBehavior(
  state: LearningState,
): string {
  switch (state) {
    case 'Sharp':
      return 'Prioritize difficult / new material'

    case 'Steady':
      return 'Standard scheduling'

    case 'Warming Down':
      return 'Prioritize familiar material; consider a break'

    case 'Recovering':
      return 'Gradually restore difficulty'

    case 'Insufficient Signal':
      return 'Standard scheduling — learning your rhythm'
  }
}
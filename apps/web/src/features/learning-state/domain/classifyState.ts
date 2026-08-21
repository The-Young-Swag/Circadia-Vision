import { hasBaseline as checkHasBaseline, isElevatedLoad } from '#/shared/lib/baseline'
import type { BaselineMap } from '#/shared/lib/baseline'
import type { AggregatedFeatures } from '#/shared/lib/signals'

export type LearningState = 'Sharp' | 'Steady' | 'Warming Down' | 'Recovering' | 'Insufficient Signal'

type ClassifyInput = {
  baseline: BaselineMap
  recent: AggregatedFeatures[]
  previousState?: LearningState
}

// Pure domain — no React, no DB, no HTTP (Guide §15)
export function classifyLearningState({ baseline, recent, previousState }: ClassifyInput): { state: LearningState; reason: string } {
  if (!checkHasBaseline(baseline)) {
    return { state: 'Insufficient Signal', reason: 'Not enough sessions yet — standard scheduling for now.' }
  }

  const elevated = isElevatedLoad(recent, baseline)

  // Recovering: was warming down, now not elevated but recent was
  if (previousState === 'Warming Down' && !elevated && recent.length >= 2) {
    // Check if moving back toward baseline (z decreasing)
    return { state: 'Recovering', reason: 'Your rhythm is moving back toward baseline — easing difficulty gradually.' }
  }

  if (elevated) {
    return { state: 'Warming Down', reason: 'Your typing rhythm has been less stable for several minutes.' }
  }

  // Check how close to baseline — Sharp vs Steady
  if (recent.length > 0) {
    const isStable = recent.length >= 3 && !elevated
    if (isStable) {
      return { state: 'Steady', reason: 'Rhythm close to your personal baseline.' }
    }
  }

  return { state: 'Steady', reason: 'Rhythm within your normal range.' }
}

// Helper for Home's qualitative display — never fake-precise
export function stateLabel(state: LearningState): string {
  return state
}

export function stateBehavior(state: LearningState): string {
  switch (state) {
    case 'Sharp': return 'Prioritize difficult / new material'
    case 'Steady': return 'Standard scheduling'
    case 'Warming Down': return 'Prioritize familiar material; consider a break'
    case 'Recovering': return 'Gradually restore difficulty'
    case 'Insufficient Signal': return 'Standard scheduling — learning your rhythm'
  }
}

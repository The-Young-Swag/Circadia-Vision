import { settingsRepository } from '#/shared/repositories/settingsRepository'

const METRIC_KEYS = {
  calibrationAttempts: 'metrics:calibrationAttempts',
  calibrationCompletions: 'metrics:calibrationCompletions',
  adaptiveOffers: 'metrics:adaptiveOffers',
  adaptiveDismissals: 'metrics:adaptiveDismissals',
  adaptiveOverrides: 'metrics:adaptiveOverrides',
} as const

type MetricKey =
  (typeof METRIC_KEYS)[keyof typeof METRIC_KEYS]

async function incrementMetric(
  key: MetricKey,
): Promise<number> {
  const current =
    await settingsRepository.getMetric(key)

  const next = current + 1

  await settingsRepository.setMetric(key, next)

  return next
}

export async function trackCalibrationAttempt(): Promise<void> {
  await incrementMetric(
    METRIC_KEYS.calibrationAttempts,
  )
}

export async function trackCalibrationCompletion(): Promise<void> {
  await incrementMetric(
    METRIC_KEYS.calibrationCompletions,
  )
}

export async function trackAdaptiveOffer(): Promise<void> {
  await incrementMetric(
    METRIC_KEYS.adaptiveOffers,
  )
}

export async function trackAdaptiveDismiss(): Promise<void> {
  await incrementMetric(
    METRIC_KEYS.adaptiveDismissals,
  )
}

export async function trackAdaptiveOverride(): Promise<void> {
  await incrementMetric(
    METRIC_KEYS.adaptiveOverrides,
  )
}

export async function getMetrics() {
  const [
    attempts,
    completions,
    offers,
    dismissals,
    overrides,
  ] = await Promise.all([
    settingsRepository.getMetric(
      METRIC_KEYS.calibrationAttempts,
    ),
    settingsRepository.getMetric(
      METRIC_KEYS.calibrationCompletions,
    ),
    settingsRepository.getMetric(
      METRIC_KEYS.adaptiveOffers,
    ),
    settingsRepository.getMetric(
      METRIC_KEYS.adaptiveDismissals,
    ),
    settingsRepository.getMetric(
      METRIC_KEYS.adaptiveOverrides,
    ),
  ])

  return {
    calibrationCompletionRate:
      attempts > 0
        ? completions / attempts
        : null,

    adaptiveDismissRate:
      offers > 0
        ? dismissals / offers
        : null,

    adaptiveOverrideRate:
      offers > 0
        ? overrides / offers
        : null,

    raw: {
      attempts,
      completions,
      offers,
      dismissals,
      overrides,
    },
  }
}
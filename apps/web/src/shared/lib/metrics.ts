/**
 * KPI instrumentation per Brief §6 — Level 2 & North Star
 * Calibration completion rate and adaptive override/dismiss rate are first-class health metrics.
 * Stored locally (Dexie appSettings) — no backend needed, offline-first.
 */

import { getSetting, setSetting } from '#/shared/lib/db/dexie'

const KEYS = {
  calibrationAttempts: 'metrics:calibrationAttempts',
  calibrationCompletions: 'metrics:calibrationCompletions',
  adaptiveOffers: 'metrics:adaptiveOffers',
  adaptiveDismissals: 'metrics:adaptiveDismissals',
  adaptiveOverrides: 'metrics:adaptiveOverrides',
} as const

async function inc(key: string): Promise<number> {
  const cur = await getSetting<number>(key, 0)
  const next = cur + 1
  await setSetting(key, next)
  return next
}

export async function trackCalibrationAttempt() {
  await inc(KEYS.calibrationAttempts)
}

export async function trackCalibrationCompletion() {
  await inc(KEYS.calibrationCompletions)
}

export async function trackAdaptiveOffer() {
  await inc(KEYS.adaptiveOffers)
}

export async function trackAdaptiveDismiss() {
  await inc(KEYS.adaptiveDismissals)
}

export async function trackAdaptiveOverride() {
  await inc(KEYS.adaptiveOverrides)
}

export async function getMetrics() {
  const [attempts, completions, offers, dismissals, overrides] = await Promise.all([
    getSetting<number>(KEYS.calibrationAttempts, 0),
    getSetting<number>(KEYS.calibrationCompletions, 0),
    getSetting<number>(KEYS.adaptiveOffers, 0),
    getSetting<number>(KEYS.adaptiveDismissals, 0),
    getSetting<number>(KEYS.adaptiveOverrides, 0),
  ])
  return {
    calibrationCompletionRate: attempts ? completions / attempts : null,
    adaptiveDismissRate: offers ? dismissals / offers : null,
    adaptiveOverrideRate: offers ? overrides / offers : null,
    raw: { attempts, completions, offers, dismissals, overrides },
  }
}

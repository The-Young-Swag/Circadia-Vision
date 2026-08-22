import Dexie from 'dexie'
import type { Table } from 'dexie'

import type {
  AppSettings,
  BaselineFeature,
  Card,
  Insight,
  ReviewSession,
  SessionSignal,
} from '#/shared/types/domain'

// ---------------------------------------------------------------------------
// Dexie DB
// ---------------------------------------------------------------------------

export class CircadiaDB extends Dexie {
  cards!: Table<Card, string>
  reviewSessions!: Table<ReviewSession, string>
  baselineFeatures!: Table<BaselineFeature, string>
  sessionSignals!: Table<SessionSignal, string>
  insights!: Table<Insight, string>
  appSettings!: Table<AppSettings, string>

  constructor() {
    super('circadia')

    this.version(1).stores({
      cards: 'id, topic, dueDate, targetDate, createdAt',
      reviewSessions: 'id, cardId, sessionId, timestamp',
      baselineFeatures: 'name',
      sessionSignals: 'id, sessionId, minuteIndex, timestamp',
      insights: 'id, timestamp, dismissed, kind',
      appSettings: 'key',
    })
  }
}

export const db = new CircadiaDB()

// ---------------------------------------------------------------------------
// Helpers for settings (adaptive opt-in, calibration)
// ---------------------------------------------------------------------------

export async function getSetting<T>(
  key: string,
  fallback: T,
): Promise<T> {
  const row = await db.appSettings.get(key)

  if (!row) {
    return fallback
  }

  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

export async function setSetting<T>(
  key: string,
  value: T,
): Promise<void> {
  await db.appSettings.put({
    key,
    value: JSON.stringify(value),
  })
}

// Convenience keys
export const SETTINGS_KEYS = {
  adaptiveOptIn: 'adaptiveOptIn',
  calibrationSessions: 'calibrationSessions',
  hasSeenOnboarding: 'hasSeenOnboarding',
} as const
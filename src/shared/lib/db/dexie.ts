import Dexie from 'dexie'
import type {Table} from 'dexie';

// ---------------------------------------------------------------------------
// Types — single source of truth for IndexedDB
// ---------------------------------------------------------------------------

export type Card = {
  id: string
  front: string
  back: string
  topic: string
  targetDate?: string // ISO date, optional exam/target
  createdAt: string // ISO
  // SM-2 state
  interval: number // days
  repetitions: number
  easeFactor: number
  dueDate: string // ISO date (YYYY-MM-DD)
  lastReviewed?: string // ISO
}

export type ReviewSession = {
  id: string
  cardId: string
  sessionId: string
  timestamp: string // ISO
  grade: number // 0 Again, 1 Hard, 2 Good, 3 Easy (maps to SM-2 q=0,3,4,5)
  durationMs?: number
}

export type BaselineFeature = {
  name: FeatureName
  mean: number
  variance: number // EWMA variance (for stddev)
  stddev: number
  sampleCount: number
  lastUpdated: string
}

export type FeatureName =
  'interKeyLatency' | 'dwellTime' | 'correctionRate' | 'wpm'

export type SessionSignal = {
  id: string
  sessionId: string
  minuteIndex: number
  timestamp: string
  interKeyLatency: number
  dwellTime: number
  correctionRate: number
  wpm: number
  // rolling z-scores at that minute (for debugging/insight, not raw keys)
  zScores?: Record<FeatureName, number>
}

export type Insight = {
  id: string
  statement: string
  stat: string
  timestamp: string
  dismissed: boolean
  kind: 'retention' | 'focus' | 'peak' | 'general'
}

export type AppSettings = {
  key: string
  value: string // JSON-encoded
}

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

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.appSettings.get(key)
  if (!row) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await db.appSettings.put({ key, value: JSON.stringify(value) })
}

// Convenience keys
export const SETTINGS_KEYS = {
  adaptiveOptIn: 'adaptiveOptIn', // boolean | null (null = not asked)
  calibrationSessions: 'calibrationSessions', // number
  hasSeenOnboarding: 'hasSeenOnboarding',
} as const

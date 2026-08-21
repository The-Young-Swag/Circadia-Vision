import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const insightKindEnum = pgEnum('insight_kind', [
  'retention',
  'focus',
  'peak',
  'general',
])

export const featureNameEnum = pgEnum('feature_name', [
  'interKeyLatency',
  'dwellTime',
  'correctionRate',
  'wpm',
])

export const cards = pgTable('cards', {
  id: text('id').primaryKey(),
  front: text('front').notNull(),
  back: text('back').notNull(),
  topic: text('topic').notNull(),
  targetDate: date('target_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  interval: real('interval').notNull(),
  repetitions: integer('repetitions').notNull(),
  easeFactor: real('ease_factor').notNull(),
  dueDate: date('due_date').notNull(),
  lastReviewed: timestamp('last_reviewed', { withTimezone: true }),
})

export const reviewSessions = pgTable('review_sessions', {
  id: text('id').primaryKey(),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  grade: integer('grade').notNull(),
  durationMs: integer('duration_ms'),
})

export const baselineFeatures = pgTable('baseline_features', {
  name: featureNameEnum('name').primaryKey(),
  mean: real('mean').notNull(),
  variance: real('variance').notNull(),
  stddev: real('stddev').notNull(),
  sampleCount: integer('sample_count').notNull(),
  lastUpdated: timestamp('last_updated', {
    withTimezone: true,
  }).notNull(),
})

export const sessionSignals = pgTable('session_signals', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  minuteIndex: integer('minute_index').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  interKeyLatency: real('inter_key_latency').notNull(),
  dwellTime: real('dwell_time').notNull(),
  correctionRate: real('correction_rate').notNull(),
  wpm: real('wpm').notNull(),
  zScores: jsonb('z_scores'),
})

export const insights = pgTable('insights', {
  id: text('id').primaryKey(),
  statement: text('statement').notNull(),
  stat: text('stat').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  dismissed: boolean('dismissed').notNull(),
  kind: insightKindEnum('kind').notNull(),
})

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
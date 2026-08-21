// Global shared types — only truly cross-cutting types here (Guide: types/ for global only)
// Feature-specific types stay in features/*/types.ts
export type { Card, ReviewSession, BaselineFeature, SessionSignal, Insight, AppSettings, FeatureName } from '#/db/dexie'
export type { Grade, SM2State, SM2Result } from '#/lib/sm2'

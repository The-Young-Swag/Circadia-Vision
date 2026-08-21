import { z } from 'zod'
import { SyncPushSchema as SharedPush, SyncPullSchema as SharedPull } from '@circadia/shared'

// All client input is untrusted (Guide §9) — validate at every server boundary
// Re-export shared schemas as single source (Guide §40: types from schemas)
export const SyncPushSchema = SharedPush
export const SyncPullQuerySchema = SharedPull

export const KvUpsertSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

export const KvKeyParamSchema = z.object({
  key: z.string().min(1),
})

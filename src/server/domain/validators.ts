import { z } from 'zod'

// All client input is untrusted (Guide §9) — validate at every server boundary

export const SyncPushSchema = z.object({
  deviceId: z.string().min(1),
  kind: z.string().min(1), // cards | sessions | signals
  payload: z.unknown(),
})

export const SyncPullQuerySchema = z.object({
  deviceId: z.string().min(1),
  kind: z.string().min(1),
})

export const KvUpsertSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

export const KvKeyParamSchema = z.object({
  key: z.string().min(1),
})

import { z } from 'zod'

// Shared Zod schemas — single source of truth for client and server boundaries
// Guide §8: validate every server boundary, §36 multi-layer validation

export const DeviceIdSchema = z.string().min(1).max(64)
export const SyncKindSchema = z.enum(['cards', 'sessions', 'signals', 'insights'])

export const SyncPushSchema = z.object({
  deviceId: DeviceIdSchema,
  kind: SyncKindSchema,
  payload: z.any(),
})

export const SyncPullSchema = z.object({
  deviceId: DeviceIdSchema,
  kind: SyncKindSchema,
})

export type SyncPushInput = z.infer<typeof SyncPushSchema>
export type SyncPullInput = z.infer<typeof SyncPullSchema>

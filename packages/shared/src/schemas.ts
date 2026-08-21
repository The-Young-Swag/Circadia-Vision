import { z } from 'zod'

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

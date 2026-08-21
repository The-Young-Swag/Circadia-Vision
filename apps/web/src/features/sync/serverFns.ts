import { createServerFn } from '@tanstack/react-start'
import { SyncPushSchema, SyncPullSchema } from '@circadia/shared'

// Server Functions are internal Start → Server calls (Guide §6), not public HTTP APIs (Guide §7)
// They provide typed, validated RPC with Zod at the boundary (Guide §8)
// Client calls them, but handler runs server-only — API keys, DB, file-system never reach browser (Guide §10)

// Example: health check via Server Function (could also be via Express /health)
// Now correctly imports from sync-server via monorepo workspace — keeps client bundle clean (Guide §5)
export const getSyncHealth = createServerFn({ method: 'GET' }).handler(async () => {
  const { DB_PATH_VALUE } = await import('../../../../sync-server/src/infrastructure/database/client.js')
  return { ok: true, db: DB_PATH_VALUE, time: new Date().toISOString() }
})

export const pushSync = createServerFn({ method: 'POST' })
  .validator(SyncPushSchema)
  .handler(async ({ data }) => {
    const { syncService } = await import('../../../../sync-server/src/services/syncService.js')
    syncService.push(data.deviceId, data.kind, data.payload)
    return { ok: true }
  })

export const pullSync = createServerFn({ method: 'GET' })
  .validator(SyncPullSchema)
  .handler(async ({ data }): Promise<any> => {
    const { syncService } = await import('../../../../sync-server/src/services/syncService.js')
    const result = syncService.pull(data.deviceId, data.kind)
    return result ?? { payload: null }
  })

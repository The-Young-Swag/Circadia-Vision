import { Router } from 'express'
import { syncService } from '../../services/syncService.js'
import { SyncPushSchema, SyncPullQuerySchema } from '../../domain/validators.js'

export const syncRouter = Router()

// POST /sync/push — thin controller (Guide §23): translate HTTP → service
syncRouter.post('/push', (req, res) => {
  const parsed = SyncPushSchema.parse(req.body)
  syncService.push(parsed.deviceId, parsed.kind, parsed.payload)
  res.json({ ok: true })
})

// GET /sync/pull?deviceId=&kind= — Express 5 async without try/catch (Guide §28)
// If service throws, Express 5 forwards rejected Promise to errorHandler
syncRouter.get('/pull', (req, res) => {
  const parsed = SyncPullQuerySchema.parse(req.query)
  const result = syncService.pull(parsed.deviceId, parsed.kind)
  if (!result) {
    res.json({ payload: null })
    return
  }
  res.json({ payload: result.payload, createdAt: result.createdAt })
})

import { Router } from 'express'
import { kvService } from '../../services/syncService.js'
import { KvKeyParamSchema, KvUpsertSchema } from '../../domain/validators.js'
import { NotFoundError } from '../errors/AppError.js'

export const kvRouter = Router()

kvRouter.post('/', (req, res) => {
  const parsed = KvUpsertSchema.parse(req.body)
  kvService.set(parsed.key, parsed.value)
  res.json({ ok: true })
})

kvRouter.get('/:key', (req, res) => {
  const { key } = KvKeyParamSchema.parse(req.params)
  const value = kvService.get(key)
  if (value === null) throw new NotFoundError('not found')
  res.json({ value })
})

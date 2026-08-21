import express from 'express'
import cors from 'cors'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { syncRouter } from './routes/sync.js'
import { kvRouter } from './routes/kv.js'
import { DB_PATH_VALUE } from '../infrastructure/database/client.js'

// Express 5 layered app — boring, correct (Guide §21, §27)
// Middleware order matters: logging → security → parser → routes → error

export function createApp() {
  const app = express()

  // 1. Logging
  app.use(requestLogger)

  // 2. Security / CORS
  app.use(cors())

  // 3. Body parser (with limit — never trust client payload size)
  app.use(express.json({ limit: '5mb' }))

  // 4. Routes — thin, validated, delegated to services
  app.get('/health', (_req, res) => {
    res.json({ ok: true, db: DB_PATH_VALUE, time: new Date().toISOString() })
  })

  app.use('/sync', syncRouter)
  app.use('/kv', kvRouter)

  app.get('/', (_req, res) => {
    res.type('html').send(`
      <h1>Circadia Sync</h1>
      <p>Optional sync backend — core app works offline without it.</p>
      <ul>
        <li>GET /health</li>
        <li>POST /sync/push { deviceId, kind, payload }</li>
        <li>GET /sync/pull?deviceId=&kind=</li>
      </ul>
    `)
  })

  // 5. Centralized error handler — must be last (Guide §30)
  app.use(errorHandler)

  return app
}

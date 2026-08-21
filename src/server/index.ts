import { createApp } from './http/app.js'
import { DB_PATH_VALUE } from './infrastructure/database/client.js'

const PORT = Number(process.env.SYNC_PORT ?? 4901)
const app = createApp()

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[circadia-sync] listening on http://0.0.0.0:${PORT} db=${DB_PATH_VALUE}`)
  })
}

export default app

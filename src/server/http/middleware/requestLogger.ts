import type { Request, Response, NextFunction } from 'express'

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now()
  const { method, url } = req
  // Minimal structured log — never log secrets or payload bodies in production
  console.log(`[sync] ${method} ${url}`)
  // Could add duration on finish via res.on('finish', ...) but keep simple
  void start
  next()
}

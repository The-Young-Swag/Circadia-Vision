import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError.js'
import { ZodError } from 'zod'

// Centralized error boundary — last middleware (Guide §30)
// Never leak stack traces or SQL to client in production
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  console.error('[sync] unexpected error', err)
  res.status(500).json({ error: 'Internal server error' })
}

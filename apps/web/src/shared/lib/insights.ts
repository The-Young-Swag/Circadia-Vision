/**
 * Insights — local-only dashboard computations.
 * No streaks, no guilt — just plain patterns.
 */

import type { Card, ReviewSession } from '#/shared/lib/db/dexie'

export type RetentionByTopic = { topic: string; total: number; correct: number; rate: number }

export function retentionByTopic(
  cards: Card[],
  sessions: ReviewSession[],
): RetentionByTopic[] {
  const byTopic = new Map<string, { total: number; correct: number }>()
  const cardTopic = new Map(cards.map((c) => [c.id, c.topic] as const))

  for (const s of sessions) {
    const topic = cardTopic.get(s.cardId) ?? 'General'
    const cur = byTopic.get(topic) ?? { total: 0, correct: 0 }
    cur.total++
    if (s.grade >= 2) cur.correct++
    byTopic.set(topic, cur)
  }

  return [...byTopic.entries()]
    .map(([topic, v]) => ({
      topic,
      total: v.total,
      correct: v.correct,
      rate: v.total ? v.correct / v.total : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
}

export type SessionLengthPerf = { bucket: string; avgGrade: number; count: number }

/**
 * Buckets session length (minutes) vs avg grade.
 * Buckets: 0-10, 10-20, 20-30, 30-45, 45+
 */
export function sessionLengthVsPerf(
  sessions: ReviewSession[],
): SessionLengthPerf[] {
  // Group by sessionId
  const bySession = new Map<string, ReviewSession[]>()
  for (const s of sessions) {
    const arr = bySession.get(s.sessionId) ?? []
    arr.push(s)
    bySession.set(s.sessionId, arr)
  }

  const buckets: Record<string, { sum: number; count: number; sessions: number }> = {
    '0–10m': { sum: 0, count: 0, sessions: 0 },
    '10–20m': { sum: 0, count: 0, sessions: 0 },
    '20–30m': { sum: 0, count: 0, sessions: 0 },
    '30–45m': { sum: 0, count: 0, sessions: 0 },
    '45m+': { sum: 0, count: 0, sessions: 0 },
  }

  for (const [, list] of bySession) {
    if (list.length < 2) continue
    const times = list.map((x) => new Date(x.timestamp).getTime()).sort((a, b) => a - b)
    const durMin = (times[times.length - 1]! - times[0]!) / 60000
    const avg = list.reduce((a, b) => a + b.grade, 0) / list.length
    const key =
      durMin < 10
        ? '0–10m'
        : durMin < 20
          ? '10–20m'
          : durMin < 30
            ? '20–30m'
            : durMin < 45
              ? '30–45m'
              : '45m+'
    buckets[key]!.sum += avg
    buckets[key]!.count += list.length
    buckets[key]!.sessions += 1
  }

  return Object.entries(buckets).map(([bucket, v]) => ({
    bucket,
    avgGrade: v.sessions ? v.sum / v.sessions : 0,
    count: v.sessions,
  }))
}

export type ActionablePattern = { text: string; stat: string } | null

export function actionablePattern(
  sessions: ReviewSession[],
  cards: Card[],
): ActionablePattern {
  // Example: "Accuracy on new cards drops after ~30m"
  const freshIds = new Set(cards.filter((c) => c.repetitions <= 1).map((c) => c.id))
  const bySession = new Map<string, ReviewSession[]>()
  for (const s of sessions) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s])

  const points: { minute: number; freshCorrect: number; freshTotal: number }[] = []
  for (const [, list] of bySession) {
    const sorted = [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    // estimate minute as index * 2 (approx)
    sorted.forEach((s, idx) => {
      if (!freshIds.has(s.cardId)) return
      const minute = Math.floor(idx * 1.5)
      const bucket = points.find((p) => p.minute === minute) ?? (() => {
        const p = { minute, freshCorrect: 0, freshTotal: 0 }
        points.push(p)
        return p
      })()
      bucket.freshTotal++
      if (s.grade >= 2) bucket.freshCorrect++
    })
  }

  if (points.length < 4) return null
  points.sort((a, b) => a.minute - b.minute)
  // Find drop after 20m
  const early = points.filter((p) => p.minute < 20)
  const late = points.filter((p) => p.minute >= 20)
  const earlyRate = early.reduce((a, p) => a + p.freshCorrect, 0) / Math.max(1, early.reduce((a, p) => a + p.freshTotal, 0))
  const lateRate = late.reduce((a, p) => a + p.freshCorrect, 0) / Math.max(1, late.reduce((a, p) => a + p.freshTotal, 0))
  if (earlyRate - lateRate > 0.18) {
    return {
      text: 'Accuracy on new material dips after ~20 minutes',
      stat: `${Math.round(earlyRate * 100)}% early → ${Math.round(lateRate * 100)}% after 20m`,
    }
  }

  // Fallback: overall due backlog
  const dueToday = cards.filter((c) => c.dueDate <= new Date().toISOString().slice(0, 10)).length
  if (dueToday > 20) {
    return { text: 'You have a backlog of due cards', stat: `${dueToday} due today — consider a focused 15m session` }
  }

  return null
}

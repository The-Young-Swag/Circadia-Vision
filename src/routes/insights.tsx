import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import type { Card, ReviewSession } from '#/db/dexie'
import { retentionByTopic, sessionLengthVsPerf, actionablePattern } from '#/lib/insights'
import { cardRepository } from '#/repositories/cardRepository'
import { sessionRepository } from '#/repositories/sessionRepository'

export const Route = createFileRoute('/insights')({ component: Insights })

function Insights() {
  const [cards, setCards] = useState<Card[]>([])
  const [sessions, setSessions] = useState<ReviewSession[]>([])

  useEffect(() => {
    ;(async () => {
      setCards(await cardRepository.findAll())
      setSessions(await sessionRepository.findAll())
    })()
    const id = setInterval(async () => {
      setCards(await cardRepository.findAll())
      setSessions(await sessionRepository.findAll())
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const retention = useMemo(() => retentionByTopic(cards, sessions), [cards, sessions])
  const lengthPerf = useMemo(() => sessionLengthVsPerf(sessions), [sessions])
  const pattern = useMemo(() => actionablePattern(sessions, cards), [sessions, cards])

  // TanStack Charts is installed (v0.14) — custom bars used for SSR safety; see package.json

  return (
    <div className="page-wrap py-8">
      <p className="kicker">Insights — local only</p>
      <h1 className="display text-[28px]">Your patterns, plainly</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-1">No streaks, no guilt. Just what your own data supports.</p>

      {pattern && (
        <div className="card-flat p-5 mt-6 border-amber-200 bg-amber-50">
          <div className="text-xs font-bold tracking-wide uppercase text-amber-800">Most actionable pattern</div>
          <div className="text-[15px] font-semibold text-amber-950 mt-1">{pattern.text}</div>
          <div className="text-sm text-amber-800 mt-1">{pattern.stat}</div>
        </div>
      )}

      <section className="grid lg:grid-cols-2 gap-4 mt-6">
        <div className="card-flat p-5">
          <h2 className="font-semibold text-sm">Retention by topic</h2>
          <p className="text-xs text-[var(--ink-faint)]">Correct / total — Good or Easy counts as correct.</p>
          {retention.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)] mt-4">No data yet.</p>
          ) : (
            <div className="mt-3 space-y-1">
              {retention.map((r) => (
                <div key={r.topic} className="flex items-center gap-2 text-sm">
                  <span className="w-32 truncate font-medium">{r.topic}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div className="h-full bg-[var(--blue)]" style={{ width: `${Math.round(r.rate * 100)}%` }} />
                  </div>
                  <span className="text-xs text-[var(--ink-faint)] w-16 text-right">{Math.round(r.rate * 100)}% · {r.correct}/{r.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-flat p-5">
          <h2 className="font-semibold text-sm">Session length vs performance</h2>
          <p className="text-xs text-[var(--ink-faint)]">Average grade by bucket — visual, not numeric-obsessive.</p>
          <div className="mt-4 grid gap-2">
            {lengthPerf.map((b) => (
              <div key={b.bucket} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-xs font-medium text-[var(--ink-faint)]">{b.bucket}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--purple)]" style={{ width: `${b.count ? (b.avgGrade / 3) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-[var(--ink-faint)]">{b.count ? `${b.avgGrade.toFixed(1)}/3` : '—'} · {b.count} sessions</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card-flat p-5 mt-4">
        <h2 className="font-semibold text-sm">What this means</h2>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-[var(--ink-soft)]">
          <li>If early retention is higher, schedule new material in shorter bursts (15–20m) rather than one long session.</li>
          <li>If 45m+ bucket underperforms, let adaptive mode route harder cards to your peak window (learned from baseline deviation).</li>
          <li>All insight is derived locally — export or delete anytime in Privacy.</li>
        </ul>
      </section>
    </div>
  )
}

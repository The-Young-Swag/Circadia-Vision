import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { db, type Card, type ReviewSession } from '#/db/dexie'
import { retentionByTopic, sessionLengthVsPerf, actionablePattern } from '#/lib/insights'
import { Chart } from '@tanstack/react-charts'

export const Route = createFileRoute('/insights')({ component: Insights })

function Insights() {
  const [cards, setCards] = useState<Card[]>([])
  const [sessions, setSessions] = useState<ReviewSession[]>([])

  useEffect(() => {
    ;(async () => {
      setCards(await db.cards.toArray())
      setSessions(await db.reviewSessions.toArray())
    })()
    const id = setInterval(async () => {
      setCards(await db.cards.toArray())
      setSessions(await db.reviewSessions.toArray())
    }, 2000)
    return () => clearInterval(id)
  }, [])

  const retention = useMemo(() => retentionByTopic(cards, sessions), [cards, sessions])
  const lengthPerf = useMemo(() => sessionLengthVsPerf(sessions), [sessions])
  const pattern = useMemo(() => actionablePattern(sessions, cards), [sessions, cards])

  const retentionData = useMemo(() => retention.map((r) => ({ label: r.topic, value: Math.round(r.rate * 100) })), [retention])

  // Simple bar chart via Chart
  const barSeries = useMemo(() => [{ label: 'Retention %', data: retentionData }], [retentionData])
  const barAxes = useMemo(
    () => [
      { primary: true, type: 'band' as const, position: 'bottom' as const, getValue: (d: { label: string }) => d.label },
      { type: 'linear' as const, position: 'left' as const, getValue: (d: { value: number }) => d.value, hardMin: 0, hardMax: 100 },
    ],
    [],
  )

  const perfSeries = useMemo(
    () => [{ label: 'Avg grade', data: lengthPerf.map((b) => ({ bucket: b.bucket, grade: Number(b.avgGrade.toFixed(2)) })) }],
    [lengthPerf],
  )
  const perfAxes = useMemo(
    () => [
      { primary: true, type: 'band' as const, position: 'bottom' as const, getValue: (d: { bucket: string }) => d.bucket },
      { type: 'linear' as const, position: 'left' as const, getValue: (d: { grade: number }) => d.grade, hardMin: 0, hardMax: 3 },
    ],
    [],
  )

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
            <>
              <div className="h-[240px] mt-3">
                <Chart options={{ data: barSeries, primaryAxis: barAxes[0] as never, secondaryAxes: barAxes.slice(1) as never }} />
              </div>
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
            </>
          )}
        </div>

        <div className="card-flat p-5">
          <h2 className="font-semibold text-sm">Session length vs performance</h2>
          <p className="text-xs text-[var(--ink-faint)]">Average grade by bucket — visual, not numeric-obsessive.</p>
          <div className="h-[240px] mt-3">
            <Chart options={{ data: perfSeries, primaryAxis: perfAxes[0] as never, secondaryAxes: perfAxes.slice(1) as never }} />
          </div>
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

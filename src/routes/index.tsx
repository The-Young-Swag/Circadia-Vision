import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { db, type Card, type ReviewSession } from '#/db/dexie'
import { seedIfEmpty } from '#/db/seed'
import { retentionByTopic, sessionLengthVsPerf, actionablePattern } from '#/lib/insights'
import { useBaseline } from '#/hooks/useBaseline'
import { Chart } from '@tanstack/react-charts'
import { GraduationCap, Clock3, TrendingUp, Layers, ArrowRight, Activity, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Dashboard })

function Dashboard() {
  const [cards, setCards] = useState<Card[]>([])
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const [ready, setReady] = useState(false)
  const { hasBaseline } = useBaseline()
  const [optIn, setOptIn] = useState<boolean | null>(null)

  useEffect(() => {
    seedIfEmpty().then(() => {
      refresh()
      setReady(true)
    })
    async function refresh() {
      const [c, s] = await Promise.all([db.cards.toArray(), db.reviewSessions.toArray()])
      setCards(c)
      setSessions(s)
      const v = await db.appSettings.get('adaptiveOptIn')
      setOptIn(v ? (JSON.parse(v.value) as boolean) : null)
    }
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
  }, [])

  const dueToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return cards.filter((c) => c.dueDate <= today)
  }, [cards])

  const newCards = useMemo(() => cards.filter((c) => c.repetitions === 0), [cards])
  const retention = useMemo(() => retentionByTopic(cards, sessions), [cards, sessions])
  const pattern = useMemo(() => actionablePattern(sessions, cards), [sessions, cards])
  const lengthPerf = useMemo(() => sessionLengthVsPerf(sessions), [sessions])

  // Chart data for retention by topic (bar)
  const retentionChartData = useMemo(
    () =>
      retention.slice(0, 6).map((r) => ({
        topic: r.topic,
        rate: Math.round(r.rate * 100),
      })),
    [retention],
  )

  const retentionSeries = useMemo(
    () => [
      {
        label: 'Retention %',
        data: retentionChartData,
      },
    ],
    [retentionChartData],
  )

  const retentionAxes = useMemo(
    () => [
      { primary: true, type: 'band' as const, position: 'bottom' as const, getValue: (d: { topic: string }) => d.topic },
      { type: 'linear' as const, position: 'left' as const, getValue: (d: { rate: number }) => d.rate, hardMin: 0, hardMax: 100 },
    ],
    [],
  )

  // Pipeline: cards by interval bucket (proxy for stage)
  const pipelineBuckets = useMemo(() => {
    const buckets: Record<string, number> = { New: 0, Learning: 0, Review: 0, Mastered: 0 }
    for (const c of cards) {
      if (c.repetitions === 0) buckets.New!++
      else if (c.repetitions === 1) buckets.Learning!++
      else if (c.interval < 21) buckets.Review!++
      else buckets.Mastered!++
    }
    return buckets
  }, [cards])

  const recent = useMemo(() => [...sessions].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6), [sessions])

  if (!ready) {
    return <div className="page-wrap py-16 text-sm text-[var(--ink-faint)]">Loading your rhythm…</div>
  }

  return (
    <div className="page-wrap py-8">
      {/* Onboarding inline if not decided */}
      {optIn === null && (
        <div className="card-flat p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="kicker mb-1">Adaptive mode</p>
            <h3 className="text-base font-semibold">Allow Circadia to sense rhythm and adapt?</h3>
            <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-2xl">
              Timing-only, on-device. It quietly learns your baseline in the first 3–5 sessions, then shifts to easier material when fatigue is detected and suggests break lengths from your own history. No key content ever captured.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              className="btn-primary"
              onClick={async () => {
                await db.appSettings.put({ key: 'adaptiveOptIn', value: JSON.stringify(true) })
                setOptIn(true)
              }}
            >
              Enable
            </button>
            <button
              className="btn-ghost"
              onClick={async () => {
                await db.appSettings.put({ key: 'adaptiveOptIn', value: JSON.stringify(false) })
                setOptIn(false)
              }}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {/* Hero stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Layers size={16} />} label="Total cards" value={String(cards.length)} hint={`${newCards.length} new`} />
        <Stat icon={<Clock3 size={16} />} label="Due today" value={String(dueToday.length)} hint={dueToday.length > 12 ? 'Focus session recommended' : 'Light load'} />
        <Stat icon={<TrendingUp size={16} />} label="Avg retention" value={`${retention.length ? Math.round((retention.reduce((a, r) => a + r.rate, 0) / retention.length) * 100) : 0}%`} hint={hasBaseline ? 'Baseline active' : 'Calibrating…'} />
        <Stat icon={<Activity size={16} />} label="Sessions" value={String(new Set(sessions.map((s) => s.sessionId)).size)} hint={`${sessions.length} reviews`} />
      </section>

      {/* Pipeline + Expected mastery */}
      <section className="grid lg:grid-cols-5 gap-4 mt-6">
        <div className="card-flat p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Pipeline — cards by mastery</h2>
            <Link to="/library" className="text-xs font-medium inline-flex items-center gap-1">Library <ArrowRight size={12} /></Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(pipelineBuckets).map(([k, v]) => (
              <div key={k} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-center">
                <div className="text-xs font-medium text-[var(--ink-faint)] tracking-wide uppercase">{k}</div>
                <div className="display text-2xl mt-1">{v}</div>
                <div className="text-xs text-[var(--ink-soft)] mt-1">{Math.round((v / Math.max(1, cards.length)) * 100)}%</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <span className="h-2 w-2 rounded-full bg-[var(--blue)]" />
            Expected mastery: {cards.filter((c) => c.easeFactor >= 2.3 && c.repetitions >= 3).length} cards ready for hard material
          </div>
        </div>

        <div className="card-flat p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-3">Focus curve — session length vs performance</h2>
          {lengthPerf.every((b) => b.count === 0) ? (
            <p className="text-sm text-[var(--ink-soft)]">Not enough sessions yet. Complete 3–5 reviews to see your curve.</p>
          ) : (
            <div className="space-y-2">
              {lengthPerf.map((b) => (
                <div key={b.bucket} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-[var(--ink-faint)]">{b.bucket}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(6, (b.avgGrade / 3) * 100)}%`,
                        background: b.avgGrade > 2 ? 'var(--blue)' : b.avgGrade > 1.4 ? 'var(--amber)' : 'var(--purple)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--ink-soft)] w-14 text-right">{b.count ? `${b.avgGrade.toFixed(1)}/3` : '—'} · {b.count}</span>
                </div>
              ))}
            </div>
          )}
          {pattern && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5"><Sparkles size={12} /> Insight</div>
              <div className="text-sm font-medium text-amber-950 mt-1">{pattern.text}</div>
              <div className="text-xs text-amber-800 mt-1">{pattern.stat}</div>
            </div>
          )}
        </div>
      </section>

      {/* Retention chart + Recent + Due list */}
      <section className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card-flat p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-3">Retention by topic</h2>
          {retentionChartData.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">No reviews yet.</p>
          ) : (
            <div className="h-[220px]">
              <Chart
                options={{
                  data: retentionSeries,
                  primaryAxis: retentionAxes[0] as never,
                  secondaryAxes: retentionAxes.slice(1) as never,
                  getDatumStyle: () => ({ color: 'var(--blue)' } as never),
                  getSeriesStyle: () => ({ color: 'var(--blue)' } as never),
                  tooltip: { show: true },
                }}
              />
            </div>
          )}
          <p className="text-xs text-[var(--ink-faint)] mt-2">TanStack Charts · on-device data only</p>
        </div>

        <div className="space-y-4">
          <div className="card-flat p-5">
            <h3 className="font-semibold text-sm mb-3">Recent activity</h3>
            <div className="space-y-2">
              {recent.map((r) => {
                const card = cards.find((c) => c.id === r.cardId)
                return (
                  <div key={r.id} className="flex gap-2.5 py-2 border-b last:border-0 border-[var(--line)]">
                    <span
                      className="mt-1 h-2 w-2 rounded-full shrink-0"
                      style={{ background: r.grade >= 2 ? 'var(--blue)' : r.grade === 1 ? 'var(--amber)' : 'var(--purple)' }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm leading-tight truncate">{card?.front ?? 'Card'}</div>
                      <div className="text-xs text-[var(--ink-faint)]">{new Date(r.timestamp).toLocaleString()} · {['Again', 'Hard', 'Good', 'Easy'][r.grade]}</div>
                    </div>
                  </div>
                )
              })}
              {recent.length === 0 && <p className="text-sm text-[var(--ink-soft)]">No activity yet — start a review.</p>}
            </div>
          </div>

          <div className="card-flat p-5">
            <h3 className="font-semibold text-sm mb-3">Upcoming & overdue</h3>
            <div className="space-y-2">
              {dueToday.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0 border-[var(--line)]">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{c.front}</div>
                    <div className="text-xs text-[var(--ink-faint)]">{c.topic} · due {c.dueDate}</div>
                  </div>
                  <Link to="/review" className="text-xs font-medium text-[var(--blue)]">Review</Link>
                </div>
              ))}
              {dueToday.length === 0 && <p className="text-sm text-[var(--ink-soft)]">All caught up. New cards ready: {newCards.length}</p>}
            </div>
            <Link to="/review" className="btn-primary w-full mt-4 inline-flex justify-center items-center gap-2 no-underline">
              <GraduationCap size={16} /> Start review
            </Link>
          </div>
        </div>
      </section>

      <section className="card-flat p-5 mt-4">
        <p className="kicker">Quiet by design</p>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Circadia never records what you type — only timing deltas. Baseline is personal-only, stored in IndexedDB, visible and deletable in{' '}
          <Link to="/privacy">Privacy</Link>. When adaptation flips your queue, you’ll always see why.
        </p>
      </section>
    </div>
  )
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="card-flat p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink-faint)] tracking-wide uppercase">
        <span className="text-[var(--ink-soft)]">{icon}</span> {label}
      </div>
      <div className="display text-2xl mt-2">{value}</div>
      <div className="text-xs text-[var(--ink-soft)] mt-1">{hint}</div>
    </div>
  )
}

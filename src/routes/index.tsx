import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { retentionByTopic, sessionLengthVsPerf, actionablePattern } from '#/lib/insights'
import { useBaseline } from '#/hooks/useBaseline'
import { useDashboardData } from '#/features/dashboard/hooks/useDashboardData'
import { StatCard } from '#/features/dashboard/components/StatCard'
import { PipelineSection } from '#/features/dashboard/components/PipelineSection'
import { FocusCurve } from '#/features/dashboard/components/FocusCurve'
import { RetentionBars } from '#/features/dashboard/components/RetentionBars'
import { RecentActivity } from '#/features/dashboard/components/RecentActivity'
import { UpcomingDue } from '#/features/dashboard/components/UpcomingDue'
import { Clock3, TrendingUp, Layers, Activity } from 'lucide-react'

export const Route = createFileRoute('/')({ component: Dashboard })

// Orchestrator — UI = f(cards, sessions, optIn). No domain logic inside.
function Dashboard() {
  const { cards, sessions, ready, optIn, setOptIn } = useDashboardData()
  const { hasBaseline } = useBaseline()

  const dueToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return cards.filter((c) => c.dueDate <= today)
  }, [cards])

  const newCards = useMemo(() => cards.filter((c) => c.repetitions === 0), [cards])
  const retention = useMemo(() => retentionByTopic(cards, sessions), [cards, sessions])
  const pattern = useMemo(() => actionablePattern(sessions, cards), [sessions, cards])
  const lengthPerf = useMemo(() => sessionLengthVsPerf(sessions), [sessions])

  const retentionChartData = useMemo(
    () =>
      retention.slice(0, 6).map((r) => ({
        topic: r.topic,
        rate: Math.round(r.rate * 100),
      })),
    [retention],
  )

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

  const avgRetention = retention.length ? Math.round((retention.reduce((a, r) => a + r.rate, 0) / retention.length) * 100) : 0

  if (!ready) {
    return <div className="page-wrap py-16 text-sm text-[var(--ink-faint)]">Loading your rhythm…</div>
  }

  return (
    <div className="page-wrap py-8">
      {optIn === null && <OptInBanner onChoice={setOptIn} />}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Layers size={16} />} label="Total cards" value={String(cards.length)} hint={`${newCards.length} new`} />
        <StatCard
          icon={<Clock3 size={16} />}
          label="Due today"
          value={String(dueToday.length)}
          hint={dueToday.length > 12 ? 'Focus session recommended' : 'Light load'}
        />
        <StatCard icon={<TrendingUp size={16} />} label="Avg retention" value={`${avgRetention}%`} hint={hasBaseline ? 'Baseline active' : 'Calibrating…'} />
        <StatCard
          icon={<Activity size={16} />}
          label="Sessions"
          value={String(new Set(sessions.map((s) => s.sessionId)).size)}
          hint={`${sessions.length} reviews`}
        />
      </section>

      <section className="grid lg:grid-cols-5 gap-4 mt-6">
        <PipelineSection cards={cards} buckets={pipelineBuckets} />
        <FocusCurve buckets={lengthPerf} pattern={pattern} />
      </section>

      <section className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card-flat p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-3">Retention by topic</h2>
          <RetentionBars data={retentionChartData} />
          <p className="text-xs text-[var(--ink-faint)] mt-3">TanStack Charts installed · custom bars render SSR-safe · on-device data only</p>
        </div>
        <div className="space-y-4">
          <RecentActivity sessions={sessions} cards={cards} />
          <UpcomingDue dueToday={dueToday} newCount={newCards.length} />
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

type OptInBannerProps = {
  onChoice: (v: boolean) => void
}

// Pure presentational — props in, UI out, no duplicated state
function OptInBanner({ onChoice }: OptInBannerProps) {
  return (
    <div className="card-flat p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <p className="kicker mb-1">Adaptive mode</p>
        <h3 className="text-base font-semibold">Allow Circadia to sense rhythm and adapt?</h3>
        <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-2xl">
          Timing-only, on-device. It quietly learns your baseline in the first 3–5 sessions, then shifts to easier material when fatigue is detected and
          suggests break lengths from your own history. No key content ever captured.
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="btn-primary" onClick={() => void onChoice(true)}>
          Enable
        </button>
        <button className="btn-ghost" onClick={() => void onChoice(false)}>
          Not now
        </button>
      </div>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  Activity,
  Clock3,
  GraduationCap,
  Layers,
  Leaf,
  TrendingUp,
} from 'lucide-react'

import { useBaseline } from '#/shared/hooks/useBaseline'
import {
  gainFrameDue,
  ownershipCue,
} from '#/shared/lib/engagement-copy'
import {
  trackCalibrationAttempt,
  trackCalibrationCompletion,
} from '#/shared/lib/metrics'
import type { BaselineMap } from '#/shared/lib/baseline'
import { zScore } from '#/shared/lib/baseline'

import { useDashboardAnalytics } from '#/features/dashboard/hooks/useDashboardAnalytics'
import { useDashboardData } from '#/features/dashboard/hooks/useDashboardData'

import { RecentActivity } from '#/features/dashboard/components/RecentActivity'
import { RetentionBars } from '#/features/dashboard/components/RetentionBars'
import { StatCard } from '#/features/dashboard/components/StatCard'
import { UpcomingDue } from '#/features/dashboard/components/UpcomingDue'

export function DashboardPage() {
  const {
    cards,
    sessions,
    signals,
    ready,
    optIn,
    setOptIn,
  } = useDashboardData()

  const {
    baseline,
    hasBaseline,
  } = useBaseline()

  const {
    recentSignals,
    peakLearningHour,
    dueToday,
    newCards,
    pattern,
    sessionCount,
    recentActivity,
    retentionChartData,
    studyMinutesThisWeek,
    recentReviewCount,
    learningState,
    isCalibrating,
    recallValue,
    recallHint,
    calibrationProgress,
  } = useDashboardAnalytics({
    cards,
    sessions,
    signals,
    baseline,
    hasBaseline,
  })

  useEffect(() => {
    if (isCalibrating) {
      void trackCalibrationAttempt()
    } else {
      void trackCalibrationCompletion()
    }
  }, [isCalibrating])

  if (!ready) {
    return (
      <div className="page-wrap py-16 text-sm text-(--ink-faint)">
        Loading your rhythm…
      </div>
    )
  }

  return (
    <div className="page-wrap py-6 md:py-8 space-y-6">
      {optIn === null && (
        <section className="card-flat p-5 flex flex-col md:flex-row md:items-center gap-4 border-(--veridian)/20">
          <div className="flex-1">
            <div className="mono-label">
              Adaptive learning
            </div>

            <h3 className="text-[15px] font-medium mt-1">
              Allow Circadia to notice rhythm and suggest?
            </h3>

            <p className="text-sm text-(--ink-soft) mt-1 leading-relaxed">
              You stay in control. Suggestions are
              optional, timing-only, on-device, and never
              based on key content.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                void setOptIn(true)
              }
            >
              Enable
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                void setOptIn(false)
              }
            >
              Not now
            </button>
          </div>
        </section>
      )}

      <section className="card-flat p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${stateDot(
                learningState.state,
              )}`}
              aria-hidden
            />

            <span className="mono-label">
              {learningState.state.toUpperCase()}
            </span>

            <span className="text-xs text-(--ink-faint) font-mono">
              — {ownershipCue(sessionCount)}
            </span>
          </div>

          <h1 className="display text-[24px] md:text-[28px] mt-2 leading-tight">
            {headlineForState(
              learningState.state,
              dueToday.length,
            )}
          </h1>

          <p className="text-sm text-(--ink-soft) mt-1.5 max-w-[60ch] leading-relaxed">
            {learningState.reason}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Link
            to="/review"
            className="btn-primary inline-flex justify-center items-center gap-2 no-underline"
          >
            <GraduationCap size={16} />
            Start Focused Review
          </Link>

          <span className="text-xs text-(--ink-faint) text-center font-mono">
            {gainFrameDue(dueToday.length)}
          </span>
        </div>
      </section>

      {isCalibrating && (
        <section className="card-flat p-4 flex items-center gap-3 border-(--veridian)/20 bg-(--veridian-muted)">
          <span className="h-8 w-8 rounded-full bg-(--veridian) text-white grid place-items-center font-mono text-xs">
            {calibrationProgress}/5
          </span>

          <div className="flex-1">
            <div className="text-sm font-medium">
              Learning your rhythm:{' '}
              {calibrationProgress} of 5 sessions
            </div>

            <div className="h-2 rounded-full bg-white border border-(--line) mt-1.5 overflow-hidden">
              <div
                className="h-full bg-(--veridian)"
                style={{
                  width: `${
                    (calibrationProgress / 5) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Clock3 size={16} />}
          label="Study time"
          value={`${studyMinutesThisWeek}m`}
          hint="Last 7 days"
        />

        <StatCard
          icon={<Layers size={16} />}
          label="Reviews"
          value={String(recentReviewCount)}
          hint="Last 7 days"
        />

        <StatCard
          icon={<TrendingUp size={16} />}
          label="Recall rate"
          value={recallValue}
          hint={recallHint}
        />

        <StatCard
          icon={<Activity size={16} />}
          label="Cards due"
          value={String(dueToday.length)}
          hint={
            dueToday.length > 0
              ? gainFrameDue(dueToday.length)
              : 'Nothing waiting'
          }
        />

        <div className="card-flat p-4 col-span-2 lg:col-span-1 flex flex-col justify-center">
          <div className="mono-label">
            Current state
          </div>

          <div className="display text-xl mt-1 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${stateDot(
                learningState.state,
              )}`}
            />

            {learningState.state}
          </div>

          <div className="text-xs text-(--ink-soft) mt-1">
            {learningState.state ===
            'Insufficient Signal'
              ? 'Standard SM-2'
              : 'Personal baseline active'}
          </div>
        </div>
      </section>

      {pattern && (
        <section className="card-flat p-5 flex flex-col md:flex-row md:items-center gap-4 bg-(--surface-raised)">
          <div className="flex-1">
            <div className="mono-label flex items-center gap-1.5">
              <Leaf size={12} />
              Personal insight
            </div>

            <div className="text-[15px] font-medium mt-1 leading-snug">
              {pattern.text}
            </div>

            <div className="text-sm text-(--ink-soft) mt-1">
              {pattern.stat}
            </div>

            <div className="text-sm mt-2">
              {pattern.action}
            </div>
          </div>

          <Link
            to="/review"
            className="btn-primary shrink-0 no-underline"
          >
            Review now
          </Link>
        </section>
      )}

      <section className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card-flat p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">
              Personal Learning Rhythm
            </h2>

            <span className="mono-label">
              PERSONAL SIGNAL
            </span>
          </div>

          {hasBaseline && recentSignals.length >= 3 ? (
            <RhythmSparkline
              signals={recentSignals}
              baseline={baseline}
            />
          ) : (
            <RhythmEmptyState
              hasBaseline={hasBaseline}
              signalCount={signals.length}
            />
          )}

          <p className="text-xs text-(--ink-faint) mt-2 font-mono">
            Deviation is calculated from your personal timing
            baseline rather than population averages.
          </p>
        </div>

        <div className="lg:col-span-2 card-flat p-5">
          <h2 className="font-semibold text-sm">
            When you learn best
          </h2>

          <p className="text-xs text-(--ink-faint)">
            Personal time-of-day pattern
          </p>

          <div className="mt-4 rounded-lg border border-(--line) bg-(--surface-muted) p-4">
            {peakLearningHour === null ? (
              <p className="text-sm text-(--ink-soft) leading-relaxed">
                Circadia needs enough real timing observations in
                a time window before identifying a reliable
                learning period.
              </p>
            ) : (
              <>
                <div className="display text-2xl">
                  {formatHour(peakLearningHour)}
                </div>

                <p className="text-xs text-(--ink-faint) mt-1">
                  Lowest observed deviation from your personal
                  baseline.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card-flat p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm">
            Where to focus — retention by topic
          </h2>

          <p className="mono-label">
            Based on actual review history
          </p>

          <div className="mt-3">
            {retentionChartData.length > 0 ? (
              <RetentionBars
                data={retentionChartData}
              />
            ) : (
              <EmptyTopicState />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <RecentActivity
            items={recentActivity}
          />

          <UpcomingDue
            dueToday={dueToday}
            newCount={newCards.length}
          />
        </div>
      </section>

      <section className="card-flat p-5">
        <p className="mono-label">
          Quiet by design
        </p>

        <p className="text-sm text-(--ink-soft) mt-1 font-mono">
          Circadia never records what you type — only
          timing deltas. Your baseline stays on this
          device. Suggestions are optional — you decide.
        </p>
      </section>
    </div>
  )
}

function stateDot(state: string): string {
  switch (state) {
    case 'Sharp':
      return 'bg-(--emerald)'

    case 'Steady':
      return 'bg-(--veridian)'

    case 'Warming Down':
      return 'bg-amber-500'

    case 'Recovering':
      return 'bg-(--racing)'

    default:
      return 'bg-slate-400'
  }
}

function headlineForState(
  state: string,
  due: number,
): string {
  if (state === 'Sharp') {
    return 'You’re ready for more challenging material'
  }

  if (state === 'Warming Down') {
    return 'Familiar material may fit your current rhythm'
  }

  if (state === 'Recovering') {
    return 'Your rhythm is returning toward baseline'
  }

  if (state === 'Insufficient Signal') {
    return due > 0
      ? 'A focused review is ready when you are'
      : 'You’re all caught up — ready when you are'
  }

  return due > 0
    ? 'A focused review is ready when you are'
    : 'You’re all caught up'
}

function RhythmEmptyState({
  hasBaseline,
  signalCount,
}: {
  hasBaseline: boolean
  signalCount: number
}) {
  return (
    <div className="rounded-lg border border-(--line) bg-(--surface-muted) p-6 min-h-22.5 flex items-center">
      <div>
        <div className="text-sm font-medium">
          {hasBaseline
            ? 'Waiting for recent timing observations'
            : 'Learning your baseline'}
        </div>

        <div className="text-xs text-(--ink-faint) mt-1">
          {hasBaseline
            ? `${signalCount} timing observations available; more are needed for the recent rhythm view.`
            : 'Circadia will establish the reference from your actual sensed review sessions.'}
        </div>
      </div>
    </div>
  )
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12

  return `${displayHour}:00 ${suffix}`
}

function EmptyTopicState() {
  return (
    <div className="rounded-lg border border-(--line) bg-(--surface-muted) p-5 text-sm text-(--ink-soft)">
      Complete a few reviews and Circadia will show
      retention by topic here.
    </div>
  )
}

function RhythmSparkline({
  signals,
  baseline,
}: {
  signals: Array<{
    interKeyLatency: number
    dwellTime: number
    correctionRate: number
    wpm: number
  }>
  baseline: BaselineMap
}) {
  if (signals.length < 3) {
    return (
      <div className="rounded-lg border border-(--line) bg-(--surface-muted) p-5 min-h-22.5 flex items-center">
        <div>
          <div className="text-sm font-medium">
            Not enough recent signal
          </div>

          <div className="text-xs text-(--ink-faint) mt-1">
            Complete a few sensed review observations
            to see deviation from your baseline.
          </div>
        </div>
      </div>
    )
  }

  const values = signals.map((signal) => {
    const latency = Math.abs(
      zScore(
        signal.interKeyLatency,
        baseline.interKeyLatency,
      ),
    )

    const dwell = Math.abs(
      zScore(
        signal.dwellTime,
        baseline.dwellTime,
      ),
    )

    const correction = Math.abs(
      zScore(
        signal.correctionRate,
        baseline.correctionRate,
      ),
    )

    const wpm = Math.abs(
      zScore(signal.wpm, baseline.wpm),
    )

    return (
      (latency + dwell + correction + wpm) / 4
    )
  })

  const width = 240
  const height = 56

  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const range = Math.max(0.001, max - min)

  const step =
    width / Math.max(1, values.length - 1)

  const path = values
    .map((value, index) => {
      const x = index * step
      const normalized =
        (value - min) / range
      const y =
        height - normalized * height

      return `${index === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-14"
        role="img"
        aria-label="Recent deviation from personal baseline"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--veridian)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <line
          x1="0"
          y1={height}
          x2={width}
          y2={height}
          stroke="var(--line)"
          strokeWidth="1"
        />
      </svg>

      <div className="flex justify-between mt-2 text-[11px] font-mono text-(--ink-faint)">
        <span>Closer</span>
        <span>Recent observations</span>
      </div>
    </div>
  )
}
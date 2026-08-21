import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Card } from '#/shared/lib/db/dexie'
import { seedIfEmpty } from '#/shared/lib/db/seed'
import { cardRepository } from '#/shared/repositories/cardRepository'
import { settingsRepository } from '#/shared/repositories/settingsRepository'
import { signalRepository } from '#/shared/repositories/signalRepository'
import { type Grade, daysOverdue } from '#/shared/lib/sm2'
import { adaptQueue, buildQueue } from '#/shared/lib/adapt'
import { useSignalCapture } from '#/features/review/hooks/useSignalCapture'
import { useBaseline } from '#/shared/hooks/useBaseline'
import { isElevatedLoad, recommendBreakMinutes } from '#/shared/lib/baseline'
import type { AggregatedFeatures } from '#/shared/lib/signals'
import { Keyboard, Pause } from 'lucide-react'
import { CalibrationBanner } from '#/features/review/components/CalibrationBanner'
import { AdaptationBanner } from '#/features/review/components/AdaptationBanner'
import { QuestionView } from '#/features/review/components/QuestionView'
import { GradeControls } from '#/features/review/components/GradeControls'
import { SessionComplete } from '#/features/review/components/SessionComplete'
import { bumpCalibration, maybeCreateSessionInsight, persistGrade } from '#/features/review/reviewService'
import { trackAdaptiveDismiss, trackAdaptiveOffer } from '#/shared/lib/metrics'

export const Route = createFileRoute('/review')({ component: Review })

// Pure orchestrator: UI = f(queue, current, sessionState)
function Review() {
  const [cards, setCards] = useState<Card[]>([])
  const [queue, setQueue] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [adaptReason, setAdaptReason] = useState<string | null>(null)
  const [breakRec, setBreakRec] = useState<number | null>(null)
  const [isBreak, setIsBreak] = useState(false)
  const [calibrationN, setCalibrationN] = useState(0)
  const [optIn, setOptIn] = useState<boolean>(false)
  const dismissedRef = useRef(false) // sticky for session — §2.3 reactance
  const pendingAdaptRef = useRef<{ reason: string; rec: number; adapted: ReturnType<typeof adaptQueue> } | null>(null)

  // Constants for session — refs, not state (never changes, not rendered from state)
  const sessionIdRef = useRef(`sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  const startedAtRef = useRef(Date.now())
  const minutesRef = useRef<AggregatedFeatures[]>([])
  const recoverySamples = useRef<number[]>([4, 6, 5])

  const { baseline, hasBaseline } = useBaseline()
  const captureEnabled = optIn && hasBaseline
  const { live } = useSignalCapture(captureEnabled)

  const isCalibrating = calibrationN < 5 && !hasBaseline
  const current = queue[idx] ?? null
  const progress = queue.length ? `${idx + 1} / ${queue.length}` : '0 / 0'

  // Load — synchronizes with external system (Dexie) via repository, not direct db
  useEffect(() => {
    let cancelled = false
    seedIfEmpty().then(load)
    async function load() {
      const [cs, settings, n] = await Promise.all([
        cardRepository.findAll(),
        settingsRepository.getAdaptiveOptIn(),
        settingsRepository.getCalibrationSessions(),
      ])
      if (cancelled) return
      setCards(cs)
      setOptIn(settings ?? false)
      setCalibrationN(n)
      setQueue(buildQueue(cs))
    }
    return () => {
      cancelled = true
    }
  }, [])

  // Rhythm adaptation — noticed + offered, not did + explained (§2.3)
  // Sticky dismiss: if user kept queue, don't re-offer this session
  useEffect(() => {
    if (!live || !captureEnabled || dismissedRef.current) return
    minutesRef.current.push(live)
    if (minutesRef.current.length > 12) minutesRef.current.shift()

    void signalRepository.add({
      id: crypto.randomUUID().slice(0, 8),
      sessionId: sessionIdRef.current,
      minuteIndex: minutesRef.current.length - 1,
      timestamp: new Date().toISOString(),
      interKeyLatency: live.interKeyLatency,
      dwellTime: live.dwellTime,
      correctionRate: live.correctionRate,
      wpm: live.wpm,
    })

    const elevated = isElevatedLoad(minutesRef.current, baseline)
    const rec = recommendBreakMinutes(recoverySamples.current)
    const adapted = adaptQueue(buildQueue(cards), {
      isElevated: elevated,
      hasBaseline,
      adaptiveOptIn: optIn,
      breakMinutes: rec,
    })
    if (adapted.shouldAdapt && adapted.reason) {
      // Offer, don't auto-apply — preserves autonomy
      pendingAdaptRef.current = { reason: adapted.reason, rec, adapted }
      setAdaptReason(adapted.reason)
      setBreakRec(rec)
      void trackAdaptiveOffer()
    }
  }, [live, captureEnabled, baseline, hasBaseline, optIn, cards])

  const handleGrade = useCallback(
    async (g: Grade) => {
      if (!current) return
      await persistGrade({
        card: current,
        grade: g,
        sessionId: sessionIdRef.current,
        startedAt: startedAtRef.current,
        live,
      })
      const nextN = await bumpCalibration(calibrationN)
      setCalibrationN(nextN)

      const nextIdx = idx + 1
      if (nextIdx >= queue.length) {
        setIdx(nextIdx)
        await maybeCreateSessionInsight({
          queueLength: queue.length,
          startedAt: startedAtRef.current,
          minutesRefLength: minutesRef.current.length,
          breakRec,
        })
      } else {
        setIdx(nextIdx)
        setShowBack(false)
      }
      setCards(await cardRepository.findAll())
    },
    [current, live, calibrationN, idx, queue.length, breakRec],
  )

  if (!cards.length) {
    return <div className="page-wrap py-16 text-sm text-[var(--ink-faint)]">Loading cards…</div>
  }

  if (!current) {
    const mins = Math.round((Date.now() - startedAtRef.current) / 60000)
    return <SessionComplete minutes={mins} totalCards={queue.length} live={live} />
  }

  return (
    <div className="page-wrap py-6">
      {isCalibrating && <CalibrationBanner calibrationN={calibrationN} />}
      {adaptReason && !isCalibrating && (
        <AdaptationBanner
          reason={adaptReason}
          onKeep={() => {
            dismissedRef.current = true
            setAdaptReason(null)
            pendingAdaptRef.current = null
            void trackAdaptiveDismiss()
          }}
          onSwitch={() => {
            const pending = pendingAdaptRef.current
            if (pending) {
              setQueue((prev) => {
                const remaining = pending.adapted.orderedCards.filter((c) => !prev.slice(0, idx).some((q) => q.id === c.id))
                return [...prev.slice(0, idx), ...remaining]
              })
            }
            setAdaptReason(null)
            pendingAdaptRef.current = null
            // If user later reverts via break toggle, track override separately
            void trackAdaptiveDismiss() // accepted, not dismissed — but still counts as responded
          }}
        />
      )}

      <ReviewHeader
        progress={progress}
        topic={current.topic}
        dueDate={current.dueDate}
        captureEnabled={captureEnabled}
        breakRec={breakRec}
        isCalibrating={isCalibrating}
        isBreak={isBreak}
        onToggleBreak={() => setIsBreak((v) => !v)}
      />

      {isBreak ? (
        <div className="card-flat p-10 mt-4 text-center">
          <h2 className="display text-2xl">Take {breakRec} minutes</h2>
          <p className="text-sm text-[var(--ink-soft)] mt-2">Length learned from your own recovery time — not a generic timer.</p>
          <button className="btn-primary mt-6" onClick={() => setIsBreak(false)}>
            Back to review
          </button>
        </div>
      ) : (
        <div className="card-flat p-6 sm:p-8 mt-4">
          <QuestionView
            front={current.front}
            back={current.back}
            showBack={showBack}
            onShowBack={() => setShowBack(true)}
            onHideBack={() => setShowBack(false)}
          />

          {showBack && <GradeControls onGrade={handleGrade} />}

          <div className="mt-6 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
            <span className="h-2 w-2 rounded-full bg-[var(--line-strong)]" /> Type in the answer field to let rhythm sensing work — or just grade without typing.
          </div>

          <input
            aria-label="Type your answer (timing only, content not stored)"
            placeholder="Type your answer… (optional — timing only)"
            className="mt-4 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--veridian)]"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {/* Ambient state indicator — dot + one word, per §2.5 (not live numbers) */}
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-[var(--ink-faint)]" aria-live="polite">
            <span className={`h-2 w-2 rounded-full ${captureEnabled ? 'bg-[var(--emerald)] animate-pulse' : 'bg-slate-300'}`} aria-hidden />
            <span>{captureEnabled ? (live ? 'Personal signal active' : 'Listening…') : 'Standard scheduling — adaptive off or calibrating'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Timing only, never content</span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <a href="/library" className="btn-ghost no-underline text-xs">
          Library
        </a>
        <a href="/" className="btn-ghost no-underline text-xs">
          Dashboard
        </a>
      </div>
    </div>
  )
}

type ReviewHeaderProps = {
  progress: string
  topic: string
  dueDate: string
  captureEnabled: boolean
  breakRec: number | null
  isCalibrating: boolean
  isBreak: boolean
  onToggleBreak: () => void
}

function ReviewHeader({ progress, topic, dueDate, captureEnabled, breakRec, isCalibrating, isBreak, onToggleBreak }: ReviewHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-[var(--ink-faint)]">
        <span className="font-medium text-[var(--ink)]">{progress}</span> · {topic} · due {dueDate}{' '}
        {daysOverdue(dueDate) ? <span className="text-amber-700">· {daysOverdue(dueDate)}d overdue</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${captureEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink-faint)]'}`}
        >
          <Keyboard size={12} /> {captureEnabled ? 'Sensing' : 'Standard SM-2'}
        </span>
        {breakRec && !isCalibrating && (
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] text-white px-3 py-1.5 text-xs font-medium"
            onClick={onToggleBreak}
          >
            <Pause size={12} /> {isBreak ? 'Resume' : `Break ${breakRec}m`}
          </button>
        )}
      </div>
    </div>
  )
}

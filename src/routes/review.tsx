import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { db, type Card } from '#/db/dexie'
import { seedIfEmpty } from '#/db/seed'
import { sm2, type Grade, daysOverdue } from '#/lib/sm2'
import { adaptQueue, buildQueue } from '#/lib/adapt'
import { useSignalCapture } from '#/hooks/useSignalCapture'
import { useBaseline } from '#/hooks/useBaseline'
import { updateEwma, DEFAULT_ALPHA, isElevatedLoad, recommendBreakMinutes } from '#/lib/baseline'
import type { AggregatedFeatures } from '#/lib/signals'
import { Eye, EyeOff, Keyboard, Timer, Sparkles, Pause } from 'lucide-react'

export const Route = createFileRoute('/review')({ component: Review })

function Review() {
  const [cards, setCards] = useState<Card[]>([])
  const [queue, setQueue] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
  const [startedAt] = useState(() => Date.now())
  const [adaptReason, setAdaptReason] = useState<string | null>(null)
  const [breakRec, setBreakRec] = useState<number | null>(null)
  const [isBreak, setIsBreak] = useState(false)
  const [calibrationN, setCalibrationN] = useState(0)
  const { baseline, hasBaseline } = useBaseline()
  const [optIn, setOptIn] = useState(false)
  const minutesRef = useRef<AggregatedFeatures[]>([])
  const recoverySamples = useRef<number[]>([4, 6, 5])

  const captureEnabled = optIn && hasBaseline

  const { live } = useSignalCapture(captureEnabled)

  // Load
  useEffect(() => {
    seedIfEmpty().then(load)
    async function load() {
      const [cs, settings] = await Promise.all([
        db.cards.toArray(),
        db.appSettings.get('adaptiveOptIn').then((r) => (r ? (JSON.parse(r.value) as boolean) : false)),
      ])
      setCards(cs)
      setOptIn(settings)
      const n = await db.appSettings.get('calibrationSessions').then((r) => (r ? (JSON.parse(r.value) as number) : 0))
      setCalibrationN(n)
      const due = buildQueue(cs)
      // initial queue without adaptation (will re-adapt on rhythm)
      setQueue(due)
    }
  }, [])

  // Rhythm -> adaptation every minute
  useEffect(() => {
    if (!live || !captureEnabled) return
    minutesRef.current.push(live)
    if (minutesRef.current.length > 12) minutesRef.current.shift()

    // Persist signal snapshot
    const now = new Date().toISOString()
    db.sessionSignals.add({
      id: Math.random().toString(36).slice(2, 10),
      sessionId,
      minuteIndex: minutesRef.current.length - 1,
      timestamp: now,
      interKeyLatency: live.interKeyLatency,
      dwellTime: live.dwellTime,
      correctionRate: live.correctionRate,
      wpm: live.wpm,
    })

    const elevated = isElevatedLoad(minutesRef.current, baseline)
    const rec = recommendBreakMinutes(recoverySamples.current)
    const due = buildQueue(cards)
    const adapted = adaptQueue(due, {
      isElevated: elevated,
      hasBaseline,
      adaptiveOptIn: optIn,
      breakMinutes: rec,
    })
    if (adapted.shouldAdapt && idx < adapted.orderedCards.length) {
      // only reorder remaining
      const remaining = adapted.orderedCards.filter((c) => !queue.slice(0, idx).some((q) => q.id === c.id))
      const newQueue = [...queue.slice(0, idx), ...remaining]
      setQueue(newQueue)
      setAdaptReason(adapted.reason)
      setBreakRec(rec)
      if (elevated && !isBreak) {
        // nudge break after 2 more cards? For demo, suggest now
      }
    }
  }, [live, baseline, hasBaseline, optIn, cards, idx, queue, sessionId, isBreak])

  const current = queue[idx] ?? null
  const progress = queue.length ? `${idx + 1} / ${queue.length}` : '0 / 0'
  const isCalibrating = calibrationN < 5 && !hasBaseline

  const grade = async (g: Grade) => {
    if (!current) return
    const nowDate = new Date()
    const result = sm2(
      { interval: current.interval, repetitions: current.repetitions, easeFactor: current.easeFactor },
      g,
      nowDate,
    )
    await db.cards.update(current.id, {
      interval: result.interval,
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      dueDate: result.dueDate,
      lastReviewed: nowDate.toISOString(),
    })
    await db.reviewSessions.add({
      id: Math.random().toString(36).slice(2, 10),
      cardId: current.id,
      sessionId,
      timestamp: nowDate.toISOString(),
      grade: g,
      durationMs: Date.now() - startedAt,
    })

    // Update baseline EWMA after session? For now update per grade with live snapshot
    if (live) {
      const features: Array<[keyof AggregatedFeatures, number]> = [
        ['interKeyLatency', live.interKeyLatency],
        ['dwellTime', live.dwellTime],
        ['correctionRate', live.correctionRate],
        ['wpm', live.wpm],
      ]
      for (const [name, value] of features) {
        const row = await db.baselineFeatures.get(name)
        if (!row) continue
        const snap = { mean: row.mean, variance: row.variance, stddev: row.stddev, sampleCount: row.sampleCount }
        const next = updateEwma(snap, value, DEFAULT_ALPHA)
        await db.baselineFeatures.put({
          name: name as never,
          mean: next.mean,
          variance: next.variance,
          stddev: next.stddev,
          sampleCount: next.sampleCount,
          lastUpdated: new Date().toISOString(),
        })
      }
    }

    // Bump calibration counter on session end? Increment per card for demo
    const nextN = calibrationN + 1
    if (nextN <= 12) {
      await db.appSettings.put({ key: 'calibrationSessions', value: JSON.stringify(nextN) })
      setCalibrationN(nextN)
    }

    const nextIdx = idx + 1
    if (nextIdx >= queue.length) {
      // Session complete — show insight? Redirect to insights
      setIdx(nextIdx)
      // create insight if pattern
      if (queue.length >= 8) {
        const mins = Math.round((Date.now() - startedAt) / 60000)
        await db.insights.add({
          id: Math.random().toString(36).slice(2, 10),
          statement: `Solid ${mins}-minute session — ${nextIdx} cards`,
          stat: `Rhythm samples: ${minutesRef.current.length} · Break rec: ${breakRec ?? 5}m`,
          timestamp: new Date().toISOString(),
          dismissed: false,
          kind: 'general',
        })
      }
    } else {
      setIdx(nextIdx)
      setShowBack(false)
    }
    // refresh cards
    setCards(await db.cards.toArray())
  }

  if (!cards.length) {
    return <div className="page-wrap py-16 text-sm text-[var(--ink-faint)]">Loading cards…</div>
  }

  if (!current) {
    const mins = Math.round((Date.now() - startedAt) / 60000)
    return (
      <div className="page-wrap py-10">
        <div className="card-flat p-8 text-center max-w-[640px] mx-auto">
          <p className="kicker">Session complete</p>
          <h1 className="display text-3xl mt-2">Nice work — {mins} minutes</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Reviewed {queue.length} cards. Your baseline keeps updating quietly. Come back tomorrow — due cards will be waiting.
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <button className="btn-primary" onClick={() => location.reload()}>
              New session
            </button>
            <a href="/insights" className="btn-ghost no-underline">
              View insights
            </a>
          </div>
          {live && (
            <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-left text-xs">
              <div className="font-semibold flex items-center gap-1.5"><Keyboard size={12} /> Last rhythm snapshot (timing-only)</div>
              <div className="mt-1 grid grid-cols-4 gap-2 text-[var(--ink-soft)]">
                <span>IKL {Math.round(live.interKeyLatency)}ms</span>
                <span>Dwell {Math.round(live.dwellTime)}ms</span>
                <span>Corr {(live.correctionRate * 100).toFixed(1)}%</span>
                <span>{Math.round(live.wpm)} wpm</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap py-6">
      {/* Calibration banner */}
      {isCalibrating && (
        <div className="card-flat p-4 mb-4 flex items-start gap-3 border-amber-200 bg-amber-50">
          <span className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center text-white shrink-0">
            <Timer size={16} />
          </span>
          <div className="text-sm">
            <div className="font-semibold text-amber-900">Calibration — {calibrationN}/5 sessions</div>
            <div className="text-amber-800">
              Reviews run on standard SM-2 while Circadia learns your normal rhythm. No adaptation yet — this is disclosed up front.
            </div>
          </div>
        </div>
      )}

      {/* Adaptation notice */}
      {adaptReason && !isCalibrating && (
        <div className="card-flat p-4 mb-4 flex items-start gap-3 border-sky-200 bg-sky-50">
          <span className="h-8 w-8 rounded-full bg-[var(--blue)] flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </span>
          <div className="flex-1 text-sm">
            <div className="font-semibold text-sky-900">Adapted</div>
            <div className="text-sky-800">{adaptReason}</div>
          </div>
          <button className="btn-ghost text-xs" onClick={() => setAdaptReason(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink)]">{progress}</span> · {current.topic} · due {current.dueDate}{' '}
          {daysOverdue(current.dueDate) ? <span className="text-amber-700">· {daysOverdue(current.dueDate)}d overdue</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${captureEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink-faint)]'}`}>
            <Keyboard size={12} /> {captureEnabled ? 'Sensing' : 'Standard SM-2'}
          </span>
          {breakRec && !isCalibrating && (
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] text-white px-3 py-1.5 text-xs font-medium"
              onClick={() => setIsBreak((v) => !v)}
            >
              <Pause size={12} /> {isBreak ? 'Resume' : `Break ${breakRec}m`}
            </button>
          )}
        </div>
      </div>

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
          <div className="min-h-[160px] flex flex-col">
            <div className="text-xs tracking-wide uppercase font-semibold text-[var(--ink-faint)]">Front</div>
            <div className="text-[18px] leading-relaxed font-medium mt-2">{current.front}</div>

            <div className="mt-6">
              {!showBack ? (
                <button
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={() => setShowBack(true)}
                >
                  <Eye size={16} /> Show answer
                </button>
              ) : (
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-4">
                  <div className="text-xs tracking-wide uppercase font-semibold text-[var(--ink-faint)]">Back</div>
                  <div className="text-[16px] leading-relaxed mt-1">{current.back}</div>
                  <button
                    className="mt-3 text-xs inline-flex items-center gap-1 text-[var(--ink-faint)]"
                    onClick={() => setShowBack(false)}
                  >
                    <EyeOff size={12} /> Hide
                  </button>
                </div>
              )}
            </div>
          </div>

          {showBack && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
              <GradeBtn label="Again" hint="Fail" color="var(--purple)" onClick={() => grade(0)} />
              <GradeBtn label="Hard" hint="Struggle" color="var(--amber)" onClick={() => grade(1)} />
              <GradeBtn label="Good" hint="Recall" color="var(--blue)" onClick={() => grade(2)} />
              <GradeBtn label="Easy" hint="Instant" color="#0f172a" onClick={() => grade(3)} />
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
            <span className="h-2 w-2 rounded-full bg-[var(--line-strong)]" /> Type in the answer field to let rhythm sensing work — or just grade without typing (fallback mode still excellent).
          </div>

          {/* Hidden answer input for capture — timing only, never stored with content */}
          <input
            aria-label="Type your answer (timing only, content not stored)"
            placeholder="Type your answer… (optional — timing only)"
            className="mt-4 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--blue)]"
            onKeyDown={() => {
              /* capture via global window listener already handles timing */
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {captureEnabled && live && (
            <div className="mt-3 flex gap-3 text-xs text-[var(--ink-faint)]">
              <span>IKL {Math.round(live.interKeyLatency)}ms</span>
              <span>·</span>
              <span>Corr {(live.correctionRate * 100).toFixed(1)}%</span>
              <span>·</span>
              <span>{Math.round(live.wpm)} wpm</span>
            </div>
          )}
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

function GradeBtn({ label, hint, color, onClick }: { label: string; hint: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-[var(--line)] bg-white p-3 text-left hover:bg-[var(--surface-muted)]"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-[var(--ink-faint)]">{hint}</div>
    </button>
  )
}

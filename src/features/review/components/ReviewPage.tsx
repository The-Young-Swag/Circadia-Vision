import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from 'react'

  import { Keyboard, Pause } from 'lucide-react'

  import type { Card } from '#/shared/types/domain'
  import type { Grade } from '#/shared/lib/sm2'
  import type { AggregatedFeatures } from '#/shared/lib/signals'

  import { seedIfEmpty } from '#/shared/lib/db/seed'
  import { daysOverdue } from '#/shared/lib/sm2'
  import {
    adaptQueue,
    buildQueue,
  } from '#/shared/lib/adapt'
  import {
    isElevatedLoad,
    recommendBreakMinutes,
  } from '#/shared/lib/baseline'

  import { cardRepository } from '#/shared/repositories/cardRepository'
  import { settingsRepository } from '#/shared/repositories/settingsRepository'
  import { signalRepository } from '#/shared/repositories/signalRepository'

  import { useBaseline } from '#/shared/hooks/useBaseline'

  import { useSignalCapture } from '#/features/review/hooks/useSignalCapture'

  import { CalibrationBanner } from '#/features/review/components/CalibrationBanner'
  import { AdaptationBanner } from '#/features/review/components/AdaptationBanner'
  import { QuestionView } from '#/features/review/components/QuestionView'
  import { GradeControls } from '#/features/review/components/GradeControls'
  import { SessionComplete } from '#/features/review/components/SessionComplete'

  import {
    completeCalibrationSession,
    persistGrade,
  } from '#/features/review/reviewService'

  import {
    trackAdaptiveDismiss,
    trackAdaptiveOffer,
  } from '#/shared/lib/metrics'

  export function ReviewPage() {
    const [cards, setCards] = useState<Card[]>([])
    const [queue, setQueue] = useState<Card[]>([])
    const [idx, setIdx] = useState(0)
    const [showBack, setShowBack] = useState(false)

    const [adaptReason, setAdaptReason] =
      useState<string | null>(null)

    const [breakRec, setBreakRec] =
      useState<number | null>(null)

    const [isBreak, setIsBreak] = useState(false)

    const [calibrationN, setCalibrationN] = useState(0)
    const [optIn, setOptIn] = useState(false)

    const dismissedRef = useRef(false)

    const pendingAdaptRef = useRef<{
      reason: string
      rec: number
      adapted: ReturnType<typeof adaptQueue>
    } | null>(null)

    const sessionIdRef = useRef(
      `sess-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
    )

    const startedAtRef = useRef(Date.now())

    const minutesRef = useRef<AggregatedFeatures[]>([])

    const {
      baseline,
      hasBaseline,
    } = useBaseline()

    const captureEnabled = optIn && hasBaseline

    const { live } = useSignalCapture(captureEnabled)

    const isCalibrating =
      calibrationN < 5 && !hasBaseline

    const current = queue[idx]

    const progress = queue.length
      ? `${Math.min(idx + 1, queue.length)} / ${queue.length}`
      : '0 / 0'

    useEffect(() => {
      async function load() {
        await seedIfEmpty()

        const [
          loadedCards,
          adaptiveOptIn,
          calibrationSessions,
        ] = await Promise.all([
          cardRepository.findAll(),
          settingsRepository.getAdaptiveOptIn(),
          settingsRepository.getCalibrationSessions(),
        ])

        setCards(loadedCards)
        setOptIn(adaptiveOptIn ?? false)
        setCalibrationN(
          Math.min(calibrationSessions, 5),
        )
        setQueue(buildQueue(loadedCards))
      }

      void load()
    }, [])

    useEffect(() => {
      if (
        !live ||
        !captureEnabled ||
        dismissedRef.current
      ) {
        return
      }

      minutesRef.current.push(live)

      if (minutesRef.current.length > 12) {
        minutesRef.current.shift()
      }

      void signalRepository.create({
        id: crypto.randomUUID().slice(0, 8),
        sessionId: sessionIdRef.current,
        minuteIndex: minutesRef.current.length - 1,
        timestamp: new Date().toISOString(),
        interKeyLatency: live.interKeyLatency,
        dwellTime: live.dwellTime,
        correctionRate: live.correctionRate,
        wpm: live.wpm,
      })

      const elevated = isElevatedLoad(
        minutesRef.current,
        baseline,
      )

      const recoverySamples: number[] = []

      const recommendedBreak =
        recoverySamples.length > 0
          ? recommendBreakMinutes(recoverySamples)
          : null

      const adapted = adaptQueue(
        buildQueue(cards),
        {
          isElevated: elevated,
          hasBaseline,
          adaptiveOptIn: optIn,
          breakMinutes: recommendedBreak ?? 5,
        },
      )

      if (
        adapted.shouldAdapt &&
        adapted.reason
      ) {
        pendingAdaptRef.current = {
          reason: adapted.reason,
          rec: recommendedBreak ?? 5,
          adapted,
        }

        setAdaptReason(adapted.reason)
        setBreakRec(recommendedBreak)

        void trackAdaptiveOffer()
      }
    }, [
      live,
      captureEnabled,
      baseline,
      hasBaseline,
      optIn,
      cards,
    ])

    const handleGrade = useCallback(
      async (grade: Grade) => {
        if (idx >= queue.length) {
          return
        }

        const card = queue[idx]

        await persistGrade({
          card,
          grade,
          sessionId: sessionIdRef.current,
          startedAt: startedAtRef.current,
          live,
        })

        const nextIdx = idx + 1

        if (nextIdx >= queue.length) {
          setIdx(nextIdx)

          if (calibrationN < 5) {
            const nextCalibrationN =
              await completeCalibrationSession(
                calibrationN,
              )

            setCalibrationN(nextCalibrationN)
          }
        } else {
          setIdx(nextIdx)
          setShowBack(false)
        }

        const refreshedCards =
          await cardRepository.findAll()

        setCards(refreshedCards)
      },
      [
        queue,
        idx,
        live,
        calibrationN,
      ],
    )

    if (!cards.length) {
      return (
        <div className="page-wrap py-16 text-sm text-(--ink-faint)">
          Loading cards…
        </div>
      )
    }

    if (idx >= queue.length) {
      const minutes = Math.max(
        0,
        Math.round(
          (Date.now() -
            startedAtRef.current) /
            60000,
        ),
      )

      return (
        <SessionComplete
          minutes={minutes}
          totalCards={queue.length}
          live={live}
        />
      )
    }

    return (
      <div className="page-wrap py-6">
        {isCalibrating && (
          <CalibrationBanner
            calibrationN={calibrationN}
          />
        )}

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
              const pending =
                pendingAdaptRef.current

              if (pending) {
                setQueue((previousQueue) => {
                  const completedIds = new Set(
                    previousQueue
                      .slice(0, idx)
                      .map((card) => card.id),
                  )

                  const remaining =
                    pending.adapted.orderedCards.filter(
                      (card) =>
                        !completedIds.has(card.id),
                    )

                  return [
                    ...previousQueue.slice(
                      0,
                      idx,
                    ),
                    ...remaining,
                  ]
                })
              }

              setAdaptReason(null)
              pendingAdaptRef.current = null
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
          onToggleBreak={() =>
            setIsBreak((value) => !value)
          }
        />

        {isBreak ? (
          <ReviewBreak
            breakRec={breakRec}
            onResume={() => setIsBreak(false)}
          />
        ) : (
          <ReviewCard
            card={current}
            showBack={showBack}
            captureEnabled={captureEnabled}
            live={live}
            onShowBack={() => setShowBack(true)}
            onHideBack={() => setShowBack(false)}
            onGrade={handleGrade}
          />
        )}

        <ReviewNavigation />
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

  function ReviewHeader({
    progress,
    topic,
    dueDate,
    captureEnabled,
    breakRec,
    isCalibrating,
    isBreak,
    onToggleBreak,
  }: ReviewHeaderProps) {
    const overdueDays = daysOverdue(dueDate)

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-(--ink-faint)">
          <span className="font-medium text-(--ink)">
            {progress}
          </span>{' '}
          · {topic} · due {dueDate}{' '}

          {overdueDays > 0 ? (
            <span className="text-amber-700">
              · {overdueDays}d overdue
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              captureEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-(--line) bg-(--surface-muted) text-(--ink-faint)'
            }`}
          >
            <Keyboard size={12} />

            {captureEnabled
              ? 'Sensing'
              : 'Standard SM-2'}
          </span>

          {breakRec && !isCalibrating ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-(--ink) px-3 py-1.5 text-xs font-medium text-white"
              onClick={onToggleBreak}
            >
              <Pause size={12} />

              {isBreak
                ? 'Resume'
                : `Break ${breakRec}m`}
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  type ReviewBreakProps = {
    breakRec: number | null
    onResume: () => void
  }

  function ReviewBreak({
    breakRec,
    onResume,
  }: ReviewBreakProps) {
    return (
      <div className="card-flat mt-4 p-10 text-center">
        <h2 className="display text-2xl">
          {breakRec
            ? `Take ${breakRec} minutes`
            : 'Take a short break'}
        </h2>

        <p className="mt-2 text-sm text-(--ink-soft)">
          A short pause is available if it feels
          useful. You decide when to return.
        </p>

        <button
          type="button"
          className="btn-primary mt-6"
          onClick={onResume}
        >
          Back to review
        </button>
      </div>
    )
  }

  type ReviewCardProps = {
    card: Card
    showBack: boolean
    captureEnabled: boolean
    live: AggregatedFeatures | null
    onShowBack: () => void
    onHideBack: () => void
    onGrade: (grade: Grade) => void
  }

  function ReviewCard({
    card,
    showBack,
    captureEnabled,
    live,
    onShowBack,
    onHideBack,
    onGrade,
  }: ReviewCardProps) {
    return (
      <div className="card-flat mt-4 p-6 sm:p-8">
        <QuestionView
          front={card.front}
          back={card.back}
          showBack={showBack}
          onShowBack={onShowBack}
          onHideBack={onHideBack}
        />

        {showBack ? (
          <GradeControls onGrade={onGrade} />
        ) : null}

        <div className="mt-6 flex items-center gap-2 text-xs text-(--ink-faint)">
          <span className="h-2 w-2 rounded-full bg-(--line-strong)" />
          Type in the answer field to let rhythm sensing work
          — or just grade without typing.
        </div>

        <input
          aria-label="Type your answer (timing only, content not stored)"
          placeholder="Type your answer… (optional — timing only)"
          className="mt-4 w-full rounded-xl border border-(--line) bg-white px-4 py-3 text-sm outline-none focus:border-(--veridian)"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        <SignalStatus
          captureEnabled={captureEnabled}
          live={live}
        />
      </div>
    )
  }

  type SignalStatusProps = {
    captureEnabled: boolean
    live: AggregatedFeatures | null
  }

  function SignalStatus({
    captureEnabled,
    live,
  }: SignalStatusProps) {
    const status = captureEnabled
      ? live
        ? 'Personal signal active'
        : 'Listening…'
      : 'Standard scheduling — adaptive off or calibrating'

    return (
      <div
        className="mt-3 flex items-center gap-2 text-xs font-mono text-(--ink-faint)"
        aria-live="polite"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            captureEnabled
              ? 'bg-(--emerald)'
              : 'bg-slate-300'
          }`}
          aria-hidden
        />

        <span>{status}</span>

        <span className="hidden sm:inline">
          •
        </span>

        <span className="hidden sm:inline">
          Timing only, never content
        </span>
      </div>
    )
  }

  function ReviewNavigation() {
    return (
      <div className="mt-4 flex gap-2">
        <a
          href="/library"
          className="btn-ghost no-underline text-xs"
        >
          Library
        </a>

        <a
          href="/"
          className="btn-ghost no-underline text-xs"
        >
          Dashboard
        </a>
      </div>
    )
  }

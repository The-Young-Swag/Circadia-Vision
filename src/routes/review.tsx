import { createFileRoute } from '@tanstack/react-router'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import type { Card } from '#/shared/types/domain'
import { seedIfEmpty } from '#/shared/lib/db/seed'
import { cardRepository } from '#/shared/repositories/cardRepository'
import { settingsRepository } from '#/shared/repositories/settingsRepository'
import { signalRepository } from '#/shared/repositories/signalRepository'
import { daysOverdue } from '#/shared/lib/sm2'
import type { Grade } from '#/shared/lib/sm2'
import {
  adaptQueue,
  buildQueue,
} from '#/shared/lib/adapt'
import {
  isElevatedLoad,
  recommendBreakMinutes,
} from '#/shared/lib/baseline'
import type { AggregatedFeatures } from '#/shared/lib/signals'

import { useSignalCapture } from '#/features/review/hooks/useSignalCapture'
import { useBaseline } from '#/shared/hooks/useBaseline'

import { Keyboard, Pause } from 'lucide-react'

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

export const Route = createFileRoute('/review')({
  component: Review,
})

function Review() {
  const [cards, setCards] = useState<Card[]>([])
  const [queue, setQueue] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [showBack, setShowBack] =
    useState(false)

  const [adaptReason, setAdaptReason] =
    useState<string | null>(null)

  const [breakRec, setBreakRec] =
    useState<number | null>(null)

  const [isBreak, setIsBreak] =
    useState(false)

  const [calibrationN, setCalibrationN] =
    useState(0)

  const [optIn, setOptIn] =
    useState<boolean>(false)

  const dismissedRef =
    useRef(false)

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

  const startedAtRef =
    useRef(Date.now())

  const minutesRef =
    useRef<AggregatedFeatures[]>([])

  const {
    baseline,
    hasBaseline,
  } = useBaseline()

  const captureEnabled =
    optIn && hasBaseline

  const { live } =
    useSignalCapture(captureEnabled)

  const isCalibrating =
    calibrationN < 5 && !hasBaseline

  const current = queue[idx]

  const progress = queue.length
    ? `${Math.min(
        idx + 1,
        queue.length,
      )} / ${queue.length}`
    : '0 / 0'

  useEffect(() => {
    async function load() {
      await seedIfEmpty()
  
      const [
        cs,
        settings,
        n,
      ] = await Promise.all([
        cardRepository.findAll(),
        settingsRepository.getAdaptiveOptIn(),
        settingsRepository.getCalibrationSessions(),
      ])
  
      setCards(cs)
      setOptIn(settings ?? false)
      setCalibrationN(
        Math.min(n, 5),
      )
      setQueue(
        buildQueue(cs),
      )
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

    if (
      minutesRef.current.length >
      12
    ) {
      minutesRef.current.shift()
    }

    void signalRepository.create({
      id: crypto.randomUUID().slice(0, 8),
      sessionId:
        sessionIdRef.current,
      minuteIndex:
        minutesRef.current.length - 1,
      timestamp:
        new Date().toISOString(),
      interKeyLatency:
        live.interKeyLatency,
      dwellTime:
        live.dwellTime,
      correctionRate:
        live.correctionRate,
      wpm: live.wpm,
    })

    const elevated =
      isElevatedLoad(
        minutesRef.current,
        baseline,
      )

    const recoverySamples: number[] =
      []

    const rec =
      recoverySamples.length > 0
        ? recommendBreakMinutes(
            recoverySamples,
          )
        : null

    const adapted =
      adaptQueue(
        buildQueue(cards),
        {
          isElevated: elevated,
          hasBaseline,
          adaptiveOptIn:
            optIn,
          breakMinutes:
            rec ?? 5,
        },
      )

    if (
      adapted.shouldAdapt &&
      adapted.reason
    ) {
      pendingAdaptRef.current = {
        reason: adapted.reason,
        rec: rec ?? 5,
        adapted,
      }

      setAdaptReason(
        adapted.reason,
      )

      setBreakRec(rec)

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
        sessionId:
          sessionIdRef.current,
        startedAt:
          startedAtRef.current,
        live,
      })

      const nextIdx =
        idx + 1

      if (
        nextIdx >= queue.length
      ) {
        setIdx(nextIdx)

        if (
          calibrationN < 5
        ) {
          const nextCalibrationN =
            await completeCalibrationSession(
              calibrationN,
            )

          setCalibrationN(
            nextCalibrationN,
          )
        }
      } else {
        setIdx(nextIdx)
        setShowBack(false)
      }

      const refreshed =
        await cardRepository.findAll()

      setCards(refreshed)
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
    const minutes =
      Math.max(
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
        totalCards={
          queue.length
        }
        live={live}
      />
    )
  }

  return (
    <div className="page-wrap py-6">
      {isCalibrating && (
        <CalibrationBanner
          calibrationN={
            calibrationN
          }
        />
      )}

      {adaptReason &&
        !isCalibrating && (
          <AdaptationBanner
            reason={adaptReason}
            onKeep={() => {
              dismissedRef.current =
                true

              setAdaptReason(null)

              pendingAdaptRef.current =
                null

              void trackAdaptiveDismiss()
            }}
            onSwitch={() => {
              const pending =
                pendingAdaptRef.current

              if (pending) {
                setQueue((prev) => {
                  const completedIds =
                    new Set(
                      prev
                        .slice(
                          0,
                          idx,
                        )
                        .map(
                          (card) =>
                            card.id,
                        ),
                    )

                  const remaining =
                    pending.adapted.orderedCards.filter(
                      (card) =>
                        !completedIds.has(
                          card.id,
                        ),
                    )

                  return [
                    ...prev.slice(
                      0,
                      idx,
                    ),
                    ...remaining,
                  ]
                })
              }

              setAdaptReason(null)

              pendingAdaptRef.current =
                null
            }}
          />
        )}

      <ReviewHeader
        progress={progress}
        topic={current.topic}
        dueDate={current.dueDate}
        captureEnabled={
          captureEnabled
        }
        breakRec={breakRec}
        isCalibrating={
          isCalibrating
        }
        isBreak={isBreak}
        onToggleBreak={() =>
          setIsBreak(
            (value) => !value,
          )
        }
      />

      {isBreak ? (
        <div className="card-flat p-10 mt-4 text-center">
          <h2 className="display text-2xl">
            {breakRec
              ? `Take ${breakRec} minutes`
              : 'Take a short break'}
          </h2>

          <p className="text-sm text-(--ink-soft) mt-2">
            A short pause is
            available if it feels
            useful. You decide when
            to return.
          </p>

          <button
            type="button"
            className="btn-primary mt-6"
            onClick={() =>
              setIsBreak(false)
            }
          >
            Back to review
          </button>
        </div>
      ) : (
        <div className="card-flat p-6 sm:p-8 mt-4">
          <QuestionView
            front={current.front}
            back={current.back}
            showBack={showBack}
            onShowBack={() =>
              setShowBack(true)
            }
            onHideBack={() =>
              setShowBack(false)
            }
          />

          {showBack && (
            <GradeControls
              onGrade={handleGrade}
            />
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-(--ink-faint)">
            <span className="h-2 w-2 rounded-full bg-(--line-strong)" />
            Type in the answer field
            to let rhythm sensing work
            — or just grade without
            typing.
          </div>

          <input
            aria-label="Type your answer (timing only, content not stored)"
            placeholder="Type your answer… (optional — timing only)"
            className="mt-4 w-full rounded-xl border border-(--line) bg-white px-4 py-3 text-sm outline-none focus:border-(--veridian)"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

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

            <span>
              {captureEnabled
                ? live
                  ? 'Personal signal active'
                  : 'Listening…'
                : 'Standard scheduling — adaptive off or calibrating'}
            </span>

            <span className="hidden sm:inline">
              •
            </span>

            <span className="hidden sm:inline">
              Timing only, never
              content
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
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
  const overdueDays =
    daysOverdue(dueDate)

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

        {breakRec &&
          !isCalibrating && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-(--ink) text-white px-3 py-1.5 text-xs font-medium"
              onClick={
                onToggleBreak
              }
            >
              <Pause size={12} />

              {isBreak
                ? 'Resume'
                : `Break ${breakRec}m`}
            </button>
          )}
      </div>
    </div>
  )
}
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type {
  BaselineFeature,
  SessionSignal,
} from '#/shared/types/domain'

import {
  deleteAllData,
  exportAllData,
  exportCards,
  loadPrivacyData,
  setAdaptiveOptIn,
} from '#/features/privacy/privacyService'

import { exportToJson } from '#/shared/lib/import'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
})

function downloadJson(
  filename: string,
  data: unknown,
): void {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' },
  )

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

function Privacy() {
  const [optIn, setOptIn] =
    useState<boolean | null>(null)

  const [signals, setSignals] =
    useState<SessionSignal[]>([])

  const [baseline, setBaseline] =
    useState<BaselineFeature[]>([])

  const refresh = async () => {
    const data = await loadPrivacyData()

    setOptIn(data.optIn)
    setSignals(data.signals)
    setBaseline(data.baseline)
  }

  useEffect(() => {
    void refresh()

    const id = setInterval(() => {
      void refresh()
    }, 2000)

    return () => clearInterval(id)
  }, [])

  const handleOptIn = async () => {
    await setAdaptiveOptIn(true)
    setOptIn(true)
  }

  const handleOptOut = async () => {
    await setAdaptiveOptIn(false)
    setOptIn(false)
  }

  const handleExport = async () => {
    const data = await exportAllData()

    downloadJson(
      'circadia-export.json',
      data,
    )
  }

  const handleExportCards = async () => {
    const cards = await exportCards()

    const data = exportToJson(
      cards.map((card) => ({
        front: card.front,
        back: card.back,
        topic: card.topic,
      })),
    )

    downloadJson(
      'circadia-cards.json',
      data,
    )
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Delete all on-device data? This cannot be undone.',
      )
    ) {
      return
    }

    await deleteAllData()
    location.reload()
  }

  return (
    <div className="page-wrap max-w-220 py-8">
      <p className="kicker">
        Transparency & privacy
      </p>

      <h1 className="display text-[28px]">
        Your data trains only you
      </h1>

      <p className="mt-1 text-sm text-(--ink-soft)">
        Circadia never records <em>what</em> you type —
        only timing deltas — and that boundary is
        architectural: the listener resolves to a numeric
        delta and the actual <code>key</code> value is
        discarded synchronously, never reaching storage.
        No backend is required.
      </p>

      <div className="card-flat mt-6 p-5">
        <h2 className="text-sm font-semibold">
          What is measured
        </h2>

        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--blue)" />

            <span>
              <strong>Inter-key latency</strong> —
              flight time between keys (ms).
            </span>
          </li>

          <li className="flex gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--purple)" />

            <span>
              <strong>Key dwell time</strong> —
              press-to-release duration (ms).
            </span>
          </li>

          <li className="flex gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--amber)" />

            <span>
              <strong>Correction rate</strong> —
              Backspace / total keys in rolling window.
            </span>
          </li>

          <li className="flex gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0f172a]" />

            <span>
              <strong>Typing speed</strong> —
              rolling WPM (5 chars = 1 word).
            </span>
          </li>
        </ul>

        <p className="mt-3 text-xs text-(--ink-faint)">
          Only aggregated, numeric features are stored.
          Raw key content is never captured, stored, or
          included in any derived feature.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium">
            Adaptive mode
          </span>

          <span
            className={`rounded-full border px-2.5 py-1 text-xs ${
              optIn
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : optIn === false
                  ? 'border-(--line) bg-(--surface-muted) text-(--ink-faint)'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {optIn === true
              ? 'Opted in'
              : optIn === false
                ? 'Off'
                : 'Not asked'}
          </span>

          <div className="ml-auto flex gap-2">
            <button
              className="btn-ghost text-xs"
              onClick={() => void handleOptIn()}
            >
              Opt in
            </button>

            <button
              className="btn-ghost text-xs"
              onClick={() => void handleOptOut()}
            >
              Opt out
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-(--ink-faint)">
          Fallback is first-class: with adaptive off, or
          on non-keyboard input, Circadia runs as a complete
          high-quality SM-2 scheduler with zero adaptation.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card-flat p-5">
          <h3 className="text-sm font-semibold">
            Baseline (rolling EWMA)
          </h3>

          <div className="mt-3 space-y-2 text-sm">
            {baseline.length === 0 && (
              <p className="text-(--ink-soft)">
                No baseline yet — completes after 3–5
                sessions.
              </p>
            )}

            {baseline.map((item) => (
              <div
                key={item.name}
                className="flex justify-between border-b border-(--line) py-2 last:border-0"
              >
                <span className="font-medium">
                  {item.name}
                </span>

                <span className="text-(--ink-soft)">
                  μ {item.mean.toFixed(1)} · σ{' '}
                  {item.stddev.toFixed(1)} · n{' '}
                  {item.sampleCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-flat p-5">
          <h3 className="text-sm font-semibold">
            Last 24h derived values
          </h3>

          <p className="text-xs text-(--ink-faint)">
            Aggregated per-minute snapshots — never raw
            keystrokes.
          </p>

          <div className="mt-3 max-h-55 space-y-1.5 overflow-auto text-xs">
            {signals.length === 0 && (
              <p className="text-sm text-(--ink-soft)">
                No signals yet. Type in Review to generate.
              </p>
            )}

            {signals.map((signal) => (
              <div
                key={signal.timestamp}
                className="flex gap-3 rounded-lg border border-(--line) bg-(--surface-muted) px-3 py-2"
              >
                <span className="text-(--ink-faint)">
                  {new Date(
                    signal.timestamp,
                  ).toLocaleTimeString()}
                </span>

                <span>
                  IKL {Math.round(signal.interKeyLatency)}ms
                </span>

                <span>
                  Corr{' '}
                  {(signal.correctionRate * 100).toFixed(1)}
                  %
                </span>

                <span>
                  {Math.round(signal.wpm)}wpm
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-flat mt-4 p-5">
        <h3 className="text-sm font-semibold">
          Data controls
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-primary"
            onClick={() => void handleExport()}
          >
            Export JSON
          </button>

          <button
            className="btn-ghost"
            onClick={() => void handleExportCards()}
          >
            Export cards only
          </button>

          <button
            className="btn-ghost border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => void handleDelete()}
          >
            Delete all data
          </button>
        </div>

        <p className="mt-2 text-xs text-(--ink-faint)">
          One-tap full data export and one-tap full
          delete. No cloud, no account.
        </p>
      </div>

      <div className="card-flat mt-4 p-5">
        <h3 className="text-sm font-semibold">
          Offline-first & zero-cost
        </h3>

        <p className="mt-1 text-sm text-(--ink-soft)">
          Core review loop works with zero network —
          IndexedDB via Dexie is the source of truth,
          Service Worker caches assets for airplane-mode.
          Optional Express + SQLite sync (port 4901) never
          gates core function — sync just queues until it’s
          back. No paid API anywhere.
        </p>
      </div>
    </div>
  )
}
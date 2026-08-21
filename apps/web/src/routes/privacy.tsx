import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  db,
  getSetting,
  setSetting,
  SETTINGS_KEYS,
} from '#/shared/lib/db/dexie'
import { exportToJson } from '#/shared/lib/import'

export const Route = createFileRoute('/privacy')({ component: Privacy })

function Privacy() {
  const [optIn, setOptIn] = useState<boolean | null>(null)
  const [signals, setSignals] = useState<
    Array<{ timestamp: string } & Record<string, number>>
  >([])
  const [baseline, setBaseline] = useState<
    Array<{ name: string; mean: number; stddev: number; sampleCount: number }>
  >([])

  const refresh = async () => {
    setOptIn(
      await getSetting<boolean | null>(SETTINGS_KEYS.adaptiveOptIn, null),
    )
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const sigs = await db.sessionSignals
      .where('timestamp')
      .above(cutoff)
      .toArray()
    setSignals(sigs.slice(-12) as never)
    setBaseline((await db.baselineFeatures.toArray()))
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 2000)
    return () => clearInterval(id)
  }, [])

  const doExport = async () => {
    const cards = await db.cards.toArray()
    const sessions = await db.reviewSessions.toArray()
    const signalsAll = await db.sessionSignals.toArray()
    const base = await db.baselineFeatures.toArray()
    const payload = {
      exportedAt: new Date().toISOString(),
      cards,
      sessions,
      signalsAll,
      baseline: base,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'circadia-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doDelete = async () => {
    if (!confirm('Delete all on-device data? This cannot be undone.')) return
    await db.cards.clear()
    await db.reviewSessions.clear()
    await db.sessionSignals.clear()
    await db.baselineFeatures.clear()
    await db.insights.clear()
    await db.appSettings.clear()
    location.reload()
  }

  return (
    <div className="page-wrap py-8 max-w-[880px]">
      <p className="kicker">Transparency & privacy</p>
      <h1 className="display text-[28px]">Your data trains only you</h1>
      <p className="text-sm text-[var(--ink-soft)] mt-1">
        Circadia never records <em>what</em> you type — only timing deltas — and
        that boundary is architectural: the listener resolves to a numeric delta
        and the actual <code>key</code> value is discarded synchronously, never
        reaching storage. No backend is required.
      </p>

      <div className="card-flat p-5 mt-6">
        <h2 className="font-semibold text-sm">What is measured</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          <li className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--blue)] mt-1.5 shrink-0" />
            <span>
              <strong>Inter-key latency</strong> — flight time between keys
              (ms).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--purple)] mt-1.5 shrink-0" />
            <span>
              <strong>Key dwell time</strong> — press-to-release duration (ms).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--amber)] mt-1.5 shrink-0" />
            <span>
              <strong>Correction rate</strong> — Backspace / total keys in
              rolling window.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0f172a] mt-1.5 shrink-0" />
            <span>
              <strong>Typing speed</strong> — rolling WPM (5 chars = 1 word).
            </span>
          </li>
        </ul>
        <p className="text-xs text-[var(--ink-faint)] mt-3">
          Only aggregated, numeric features are stored. Raw key content is never
          captured, stored, or included in any derived feature.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium">Adaptive mode</span>
          <span
            className={`text-xs rounded-full px-2.5 py-1 border ${optIn ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : optIn === false ? 'border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink-faint)]' : 'border-amber-200 bg-amber-50 text-amber-800'}`}
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
              onClick={async () => {
                await setSetting(SETTINGS_KEYS.adaptiveOptIn, true)
                setOptIn(true)
              }}
            >
              Opt in
            </button>
            <button
              className="btn-ghost text-xs"
              onClick={async () => {
                await setSetting(SETTINGS_KEYS.adaptiveOptIn, false)
                setOptIn(false)
              }}
            >
              Opt out
            </button>
          </div>
        </div>
        <p className="text-xs text-[var(--ink-faint)] mt-2">
          Fallback is first-class: with adaptive off, or on non-keyboard input,
          Circadia runs as a complete high-quality SM-2 scheduler with zero
          adaptation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="card-flat p-5">
          <h3 className="font-semibold text-sm">Baseline (rolling EWMA)</h3>
          <div className="mt-3 space-y-2 text-sm">
            {baseline.length === 0 && (
              <p className="text-[var(--ink-soft)]">
                No baseline yet — completes after 3–5 sessions.
              </p>
            )}
            {baseline.map((b) => (
              <div
                key={b.name}
                className="flex justify-between border-b last:border-0 border-[var(--line)] py-2"
              >
                <span className="font-medium">{b.name}</span>
                <span className="text-[var(--ink-soft)]">
                  μ {b.mean.toFixed(1)} · σ {b.stddev.toFixed(1)} · n{' '}
                  {b.sampleCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-flat p-5">
          <h3 className="font-semibold text-sm">Last 24h derived values</h3>
          <p className="text-xs text-[var(--ink-faint)]">
            Aggregated per-minute snapshots — never raw keystrokes.
          </p>
          <div className="mt-3 max-h-[220px] overflow-auto space-y-1.5 text-xs">
            {signals.length === 0 && (
              <p className="text-[var(--ink-soft)] text-sm">
                No signals yet. Type in Review to generate.
              </p>
            )}
            {signals.map((s) => (
              <div
                key={s.timestamp}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 flex gap-3"
              >
                <span className="text-[var(--ink-faint)]">
                  {new Date(s.timestamp).toLocaleTimeString()}
                </span>
                <span>
                  IKL{' '}
                  {Math.round(
                    (s as unknown as { interKeyLatency: number })
                      .interKeyLatency,
                  )}
                  ms
                </span>
                <span>
                  Corr{' '}
                  {(
                    (s as unknown as { correctionRate: number })
                      .correctionRate * 100
                  ).toFixed(1)}
                  %
                </span>
                <span>
                  {Math.round((s as unknown as { wpm: number }).wpm)}wpm
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-flat p-5 mt-4">
        <h3 className="font-semibold text-sm">Data controls</h3>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className="btn-primary" onClick={doExport}>
            Export JSON
          </button>
          <button
            className="btn-ghost"
            onClick={async () => {
              const cards = await db.cards.toArray()
              const md = exportToJson(
                cards.map((c) => ({
                  front: c.front,
                  back: c.back,
                  topic: c.topic,
                })),
              )
              const blob = new Blob([md], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'circadia-cards.json'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Export cards only
          </button>
          <button
            className="btn-ghost border-red-200 text-red-700 hover:bg-red-50"
            onClick={doDelete}
          >
            Delete all data
          </button>
        </div>
        <p className="text-xs text-[var(--ink-faint)] mt-2">
          One-tap full data export and one-tap full delete. No cloud, no
          account.
        </p>
      </div>

      <div className="card-flat p-5 mt-4">
        <h3 className="font-semibold text-sm">Offline-first & zero-cost</h3>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Core review loop works with zero network — IndexedDB via Dexie is the
          source of truth, Service Worker caches assets for airplane-mode.
          Optional Express + SQLite sync (port 4901) never gates core function —
          sync just queues until it’s back. No paid API anywhere.
        </p>
      </div>
    </div>
  )
}

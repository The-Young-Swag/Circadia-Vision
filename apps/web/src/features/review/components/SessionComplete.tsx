import { Keyboard } from 'lucide-react'
import type { AggregatedFeatures } from '#/shared/lib/signals'

type SessionCompleteProps = {
  minutes: number
  totalCards: number
  live: AggregatedFeatures | null
}

export function SessionComplete({ minutes, totalCards, live }: SessionCompleteProps) {
  return (
    <div className="page-wrap py-10">
      <div className="card-flat p-8 text-center max-w-[640px] mx-auto">
        <p className="kicker">Session complete</p>
        <h1 className="display text-3xl mt-2">Nice work — {minutes} minutes</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2">
          Reviewed {totalCards} cards. Your baseline keeps updating quietly. Come back tomorrow — due cards will be waiting.
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
            <div className="font-semibold flex items-center gap-1.5">
              <Keyboard size={12} /> Last rhythm snapshot (timing-only)
            </div>
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

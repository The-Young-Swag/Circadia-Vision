import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Card } from '#/db/dexie'

type PipelineSectionProps = {
  cards: Card[]
  buckets: Record<string, number>
}

export function PipelineSection({ cards, buckets }: PipelineSectionProps) {
  const masteredReady = cards.filter((c) => c.easeFactor >= 2.3 && c.repetitions >= 3).length
  return (
    <div className="card-flat p-5 lg:col-span-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">Pipeline — cards by mastery</h2>
        <Link to="/library" className="text-xs font-medium inline-flex items-center gap-1">
          Library <ArrowRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(buckets).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-center">
            <div className="text-xs font-medium text-[var(--ink-faint)] tracking-wide uppercase">{k}</div>
            <div className="display text-2xl mt-1">{v}</div>
            <div className="text-xs text-[var(--ink-soft)] mt-1">{Math.round((v / Math.max(1, cards.length)) * 100)}%</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--ink-soft)]">
        <span className="h-2 w-2 rounded-full bg-[var(--blue)]" />
        Expected mastery: {masteredReady} cards ready for hard material
      </div>
    </div>
  )
}

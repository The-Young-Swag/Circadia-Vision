import type { Card, ReviewSession } from '#/shared/lib/db/dexie'

type RecentActivityProps = {
  sessions: ReviewSession[]
  cards: Card[]
}

export function RecentActivity({ sessions, cards }: RecentActivityProps) {
  const recent = [...sessions].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6)
  return (
    <div className="card-flat p-5">
      <h3 className="font-semibold text-sm mb-3">Recent activity</h3>
      <div className="space-y-2">
        {recent.map((r) => {
          const card = cards.find((c) => c.id === r.cardId)
          return (
            <div key={r.id} className="flex gap-2.5 py-2 border-b last:border-0 border-[var(--line)]">
              <span
                className="mt-1 h-2 w-2 rounded-full shrink-0"
                style={{ background: r.grade >= 2 ? 'var(--blue)' : r.grade === 1 ? 'var(--amber)' : 'var(--purple)' }}
              />
              <div className="min-w-0">
                <div className="text-sm leading-tight truncate">{card?.front ?? 'Card'}</div>
                <div className="text-xs text-[var(--ink-faint)]">
                  {new Date(r.timestamp).toLocaleString()} · {['Again', 'Hard', 'Good', 'Easy'][r.grade]}
                </div>
              </div>
            </div>
          )
        })}
        {recent.length === 0 && <p className="text-sm text-[var(--ink-soft)]">No activity yet — start a review.</p>}
      </div>
    </div>
  )
}

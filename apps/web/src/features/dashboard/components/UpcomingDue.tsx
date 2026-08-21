import { Link } from '@tanstack/react-router'
import { GraduationCap } from 'lucide-react'
import type { Card } from '#/shared/lib/db/dexie'

type UpcomingDueProps = {
  dueToday: Card[]
  newCount: number
}

export function UpcomingDue({ dueToday, newCount }: UpcomingDueProps) {
  return (
    <div className="card-flat p-5">
      <h3 className="font-semibold text-sm mb-3">Upcoming & overdue</h3>
      <div className="space-y-2">
        {dueToday.slice(0, 5).map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0 border-[var(--line)]">
            <div className="min-w-0">
              <div className="text-sm truncate">{c.front}</div>
              <div className="text-xs text-[var(--ink-faint)]">
                {c.topic} · due {c.dueDate}
              </div>
            </div>
            <Link to="/review" className="text-xs font-medium text-[var(--blue)]">
              Review
            </Link>
          </div>
        ))}
        {dueToday.length === 0 && <p className="text-sm text-[var(--ink-soft)]">All caught up. New cards ready: {newCount}</p>}
      </div>
      <Link to="/review" className="btn-primary w-full mt-4 inline-flex justify-center items-center gap-2 no-underline">
        <GraduationCap size={16} /> Start review
      </Link>
    </div>
  )
}

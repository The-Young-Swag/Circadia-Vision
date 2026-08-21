import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'

type RetentionItem = { topic: string; rate: number }

type RetentionBarsProps = {
  data: RetentionItem[]
}

export function RetentionBars({ data }: RetentionBarsProps) {
  if (data.length === 0)
    return <p className="text-sm text-[var(--ink-soft)]">No reviews yet.</p>
  return (
    <div className="space-y-2">
      {data.map((r) => (
        <div key={r.topic} className="flex items-center gap-3 group">
          <span className="w-28 truncate text-xs font-medium">{r.topic}</span>
          <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--blue)]"
              style={{ width: `${r.rate}%` }}
            />
          </div>
          <span className="text-xs font-medium w-10 text-right">{r.rate}%</span>
          {/* Direct per-topic action — spec §5.3 requires a button, not just a bar */}
          <Link
            to="/review"
            search={{ topic: r.topic }}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--veridian)] opacity-70 group-hover:opacity-100 hover:text-[var(--veridian-strong)] shrink-0 no-underline"
            aria-label={`Review ${r.topic}`}
          >
            Review <ArrowUpRight size={12} />
          </Link>
        </div>
      ))}
    </div>
  )
}
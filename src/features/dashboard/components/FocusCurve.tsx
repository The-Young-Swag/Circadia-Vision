import { Sparkles } from 'lucide-react'

type Bucket = { bucket: string; avgGrade: number; count: number }
type Pattern = { text: string; stat: string } | null

type FocusCurveProps = {
  buckets: Bucket[]
  pattern: Pattern
}

export function FocusCurve({ buckets, pattern }: FocusCurveProps) {
  return (
    <div className="card-flat p-5 lg:col-span-2">
      <h2 className="font-semibold text-sm mb-3">
        Focus curve — session length vs performance
      </h2>
      {buckets.every((b) => b.count === 0) ? (
        <p className="text-sm text-[var(--ink-soft)]">
          Not enough sessions yet. Complete 3–5 reviews to see your curve.
        </p>
      ) : (
        <div className="space-y-2">
          {buckets.map((b) => (
            <div key={b.bucket} className="flex items-center gap-3">
              <span className="w-16 text-xs font-medium text-[var(--ink-faint)]">
                {b.bucket}
              </span>
              <div className="flex-1 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, (b.avgGrade / 3) * 100)}%`,
                    background:
                      b.avgGrade > 2
                        ? 'var(--blue)'
                        : b.avgGrade > 1.4
                          ? 'var(--amber)'
                          : 'var(--purple)',
                  }}
                />
              </div>
              <span className="text-xs text-[var(--ink-soft)] w-14 text-right">
                {b.count ? `${b.avgGrade.toFixed(1)}/3` : '—'} · {b.count}
              </span>
            </div>
          ))}
        </div>
      )}
      {pattern && (
        <div className="mt-4 rounded-xl border border-[var(--veridian)]/30 bg-[var(--veridian-muted)] p-3">
          <div className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Sparkles size={12} className="text-[var(--veridian)]" /> Insight
          </div>
          <div className="text-sm font-medium text-[var(--ink)] mt-1">
            {pattern.text}
          </div>
          <div className="text-xs text-[var(--ink-soft)] mt-1">{pattern.stat}</div>
        </div>
      )}
    </div>
  )
}
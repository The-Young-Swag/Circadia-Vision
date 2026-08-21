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
        <div key={r.topic} className="flex items-center gap-3">
          <span className="w-28 truncate text-xs font-medium">{r.topic}</span>
          <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--blue)]"
              style={{ width: `${r.rate}%` }}
            />
          </div>
          <span className="text-xs font-medium w-10 text-right">{r.rate}%</span>
        </div>
      ))}
    </div>
  )
}

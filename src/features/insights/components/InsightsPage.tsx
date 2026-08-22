import { useInsights } from '#/features/insights/hooks/useInsights'

export function InsightsPage() {
  const { data } = useInsights()

  if (!data) {
    return (
      <div className="page-wrap py-8">
        <p className="text-sm text-(--ink-faint)">Loading insights…</p>
      </div>
    )
  }

  const { retention, lengthPerf, pattern } = data

  return (
    <div className="page-wrap py-8">
      <p className="kicker">Insights — local only</p>

      <h1 className="display text-[28px]">Your patterns, plainly</h1>

      <p className="mt-1 text-sm text-(--ink-soft)">
        No streaks, no guilt. Just what your own data supports.
      </p>

      {pattern && (
        <div className="card-flat mt-6 border-amber-200 bg-amber-50 p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Most actionable pattern
          </div>

          <div className="mt-1 text-[15px] font-semibold text-amber-950">
            {pattern.text}
          </div>

          <div className="mt-1 text-sm text-amber-800">{pattern.stat}</div>
        </div>
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-flat p-5">
          <h2 className="text-sm font-semibold">Retention by topic</h2>

          <p className="text-xs text-(--ink-faint)">
            Correct / total — Good or Easy counts as correct.
          </p>

          {retention.length === 0 ? (
            <p className="mt-4 text-sm text-(--ink-soft)">No data yet.</p>
          ) : (
            <div className="mt-3 space-y-1">
              {retention.map((item) => {
                const percentage = Math.round(item.rate * 100)

                return (
                  <div
                    key={item.topic}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="w-32 truncate font-medium">
                      {item.topic}
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--surface-muted)">
                      <div
                        className="h-full bg-(--blue)"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-16 text-right text-xs text-(--ink-faint)">
                      {percentage}% · {item.correct}/{item.total}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card-flat p-5">
          <h2 className="text-sm font-semibold">
            Session length vs performance
          </h2>

          <p className="text-xs text-(--ink-faint)">
            Average grade by bucket — visual, not numeric-obsessive.
          </p>

          <div className="mt-4 grid gap-2">
            {lengthPerf.map((item) => {
              const performance = item.reviewCount
                ? (item.averageGrade / 3) * 100
                : 0

              return (
                <div
                  key={item.sessionId}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-16 text-xs font-medium text-(--ink-faint)">
                    {item.durationMinutes.toFixed(0)}m
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--surface-muted)">
                    <div
                      className="h-full rounded-full bg-(--purple)"
                      style={{ width: `${performance}%` }}
                    />
                  </div>

                  <span className="text-xs text-(--ink-faint)">
                    {item.reviewCount
                      ? `${item.averageGrade.toFixed(1)}/3`
                      : '—'}{' '}
                    · {item.reviewCount} sessions
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card-flat mt-4 p-5">
        <h2 className="text-sm font-semibold">What this means</h2>

        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-(--ink-soft)">
          <li>
            If early retention is higher, schedule new material in shorter
            bursts (15–20m) rather than one long session.
          </li>

          <li>
            If 45m+ bucket underperforms, let adaptive mode route harder cards
            to your peak window (learned from baseline deviation).
          </li>

          <li>
            All insight is derived locally — export or delete anytime in
            Privacy.
          </li>
        </ul>
      </section>
    </div>
  )
}
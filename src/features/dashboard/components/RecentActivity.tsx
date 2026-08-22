import type { RecentActivityItem } from '#/features/dashboard/hooks/useDashboardAnalytics'

type RecentActivityProps = {
  items: RecentActivityItem[]
}

export function RecentActivity({
  items,
}: RecentActivityProps) {
  return (
    <div className="card-flat p-5">
      <h3 className="font-semibold text-sm mb-3">
        Recent activity
      </h3>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-2.5 py-2 border-b last:border-0 border-(--line)"
          >
            <span
              className="mt-1 h-2 w-2 rounded-full shrink-0"
              style={{
                background:
                  item.grade >= 2
                    ? 'var(--blue)'
                    : item.grade === 1
                      ? 'var(--amber)'
                      : 'var(--purple)',
              }}
            />

            <div className="min-w-0">
              <div className="text-sm leading-tight truncate">
                {item.cardFront}
              </div>

              <div className="text-xs text-(--ink-faint)">
                {new Date(
                  item.timestamp,
                ).toLocaleString()}{' '}
                ·{' '}
                {
                  ['Again', 'Hard', 'Good', 'Easy'][
                    item.grade
                  ]
                }
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-(--ink-soft)">
            No activity yet — start a review.
          </p>
        )}
      </div>
    </div>
  )
}
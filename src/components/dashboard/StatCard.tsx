type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
}

export function StatCard({ icon, label, value, hint }: StatCardProps) {
  return (
    <div className="card-flat p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--ink-faint)] tracking-wide uppercase">
        <span className="text-[var(--ink-soft)]">{icon}</span> {label}
      </div>
      <div className="display text-2xl mt-2">{value}</div>
      <div className="text-xs text-[var(--ink-soft)] mt-1">{hint}</div>
    </div>
  )
}

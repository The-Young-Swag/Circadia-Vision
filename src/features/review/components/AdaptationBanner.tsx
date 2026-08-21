import { Sparkles } from 'lucide-react'

type AdaptationBannerProps = {
  reason: string
  onKeep: () => void
  onSwitch: () => void
}

// Noticed + offered, not did + explained — preserves choice point (Brief §2.3)
// Dismiss is sticky for the session — parent enforces
export function AdaptationBanner({
  reason,
  onKeep,
  onSwitch,
}: AdaptationBannerProps) {
  return (
    <div className="card-flat p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 border-[var(--veridian)]/20 bg-[var(--veridian-muted)]">
      <span className="h-8 w-8 rounded-full bg-[var(--veridian)] text-white grid place-items-center shrink-0">
        <Sparkles size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--racing)]">
          Your rhythm is drifting — want easier material for a bit?
        </div>
        <div className="text-sm text-[var(--ink-soft)] mt-1 leading-relaxed">
          {reason} You’re in control — keep this queue or switch to familiar
          material.
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="btn-ghost text-xs" onClick={onKeep}>
          Keep this queue
        </button>
        <button className="btn-primary text-xs" onClick={onSwitch}>
          Switch
        </button>
      </div>
    </div>
  )
}

import { Sparkles } from 'lucide-react'

type AdaptationBannerProps = {
  reason: string
  onDismiss: () => void
}

export function AdaptationBanner({ reason, onDismiss }: AdaptationBannerProps) {
  return (
    <div className="card-flat p-4 mb-4 flex items-start gap-3 border-sky-200 bg-sky-50">
      <span className="h-8 w-8 rounded-full bg-[var(--blue)] flex items-center justify-center text-white shrink-0">
        <Sparkles size={16} />
      </span>
      <div className="flex-1 text-sm">
        <div className="font-semibold text-sky-900">Adapted</div>
        <div className="text-sky-800">{reason}</div>
      </div>
      <button className="btn-ghost text-xs" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}

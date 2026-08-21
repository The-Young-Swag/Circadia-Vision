import { Timer } from 'lucide-react'

type CalibrationBannerProps = {
  calibrationN: number
}

export function CalibrationBanner({ calibrationN }: CalibrationBannerProps) {
  return (
    <div className="card-flat p-4 mb-4 flex items-start gap-3 border-[var(--warning)]/30 bg-[var(--warning-muted)]">
      <span className="h-8 w-8 rounded-full bg-[var(--warning)] flex items-center justify-center text-white shrink-0">
        <Timer size={16} />
      </span>
      <div className="text-sm">
        <div className="font-semibold text-[var(--ink)]">
          Calibration — {calibrationN}/5 sessions
        </div>
        <div className="text-[var(--ink-soft)]">
          Reviews run on standard SM-2 while Circadia learns your normal rhythm.
          No adaptation yet.
        </div>
      </div>
    </div>
  )
}
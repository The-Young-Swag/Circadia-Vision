type GradeControlsProps = {
  onGrade: (grade: 0 | 1 | 2 | 3) => void
}

export function GradeControls({ onGrade }: GradeControlsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
      <GradeBtn
        label="Again"
        hint="Fail"
        color="var(--purple)"
        onClick={() => onGrade(0)}
      />
      <GradeBtn
        label="Hard"
        hint="Struggle"
        color="var(--amber)"
        onClick={() => onGrade(1)}
      />
      <GradeBtn
        label="Good"
        hint="Recall"
        color="var(--blue)"
        onClick={() => onGrade(2)}
      />
      <GradeBtn
        label="Easy"
        hint="Instant"
        color="#0f172a"
        onClick={() => onGrade(3)}
      />
    </div>
  )
}

function GradeBtn({
  label,
  hint,
  color,
  onClick,
}: {
  label: string
  hint: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-[var(--line)] bg-white p-3 text-left hover:bg-[var(--surface-muted)]"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-[var(--ink-faint)]">{hint}</div>
    </button>
  )
}

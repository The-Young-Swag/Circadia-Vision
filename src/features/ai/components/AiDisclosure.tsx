export function AiDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--ink-faint)]">
        <span className="h-2 w-2 rounded-full bg-[var(--emerald)]" aria-hidden /> AI • On-device • Optional
      </span>
    )
  }
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-xs leading-relaxed text-[var(--ink-soft)]">
      <div className="font-medium text-[var(--ink)] flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[var(--emerald)]" /> AI assistance — on this device, optional
      </div>
      <p className="mt-1">
        Insights and explanations are generated locally from your cards and rhythm — no key content, no clipboard, no sites, no raw keystrokes. Nothing is sent to a service unless you explicitly enable it. You can use Circadia without AI and it remains excellent.
      </p>
    </div>
  )
}

import type { Card } from '#/shared/lib/db/dexie'
import { Pencil, Trash2 } from 'lucide-react'

type LibraryTableProps = {
  cards: Card[]
  onEdit: (c: Card) => void
  onDelete: (id: string) => void
}

// Pure: UI = f(cards). No state duplication, no side effects in render.
export function LibraryTable({ cards, onEdit, onDelete }: LibraryTableProps) {
  if (cards.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-[var(--ink-soft)]">
        No cards match. Try a broader search or add a new card.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-muted)] text-xs tracking-wide uppercase text-[var(--ink-faint)]">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Front</th>
            <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">
              Back
            </th>
            <th className="text-left px-4 py-3 font-semibold">Topic</th>
            <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">
              Due
            </th>
            <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">
              SM-2
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr
              key={c.id}
              className="border-t border-[var(--line)] hover:bg-[var(--surface-muted)]"
            >
              <td className="px-4 py-3 max-w-[320px] truncate font-medium">
                {c.front}
              </td>
              <td className="px-4 py-3 max-w-[280px] truncate hidden sm:table-cell text-[var(--ink-soft)]">
                {c.back}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-[var(--surface-muted)] border border-[var(--line)] px-2.5 py-1 text-xs font-medium">
                  {c.topic}
                </span>
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-[var(--ink-soft)]">
                {c.dueDate}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--ink-faint)]">
                {c.repetitions}·{c.interval}d·{c.easeFactor.toFixed(1)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    aria-label="Edit"
                    onClick={() => onEdit(c)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[var(--line)] hover:bg-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    aria-label="Delete"
                    onClick={() => onDelete(c.id)}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[var(--line)] hover:bg-white text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

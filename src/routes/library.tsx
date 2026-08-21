import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { db, type Card } from '#/db/dexie'
import { exportToJson, exportToMarkdown } from '#/lib/import'
import { Search, Plus, Trash2, Pencil, Upload, Download, Filter, X } from 'lucide-react'
import { CardDialog } from '#/components/library/CardDialog'
import { ImportWizard } from '#/components/library/ImportWizard'

export const Route = createFileRoute('/library')({ component: Library })

function Library() {
  const [cards, setCards] = useState<Card[]>([])
  const [q, setQ] = useState('')
  const [topicFilter, setTopicFilter] = useState<string>('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)

  const refresh = async () => setCards(await db.cards.toArray())

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 1500)
    return () => clearInterval(id)
  }, [])

  const topics = useMemo(() => ['All', ...Array.from(new Set(cards.map((c) => c.topic))).sort()], [cards])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return cards.filter((c) => {
      if (topicFilter !== 'All' && c.topic !== topicFilter) return false
      if (!needle) return true
      return (
        c.front.toLowerCase().includes(needle) ||
        c.back.toLowerCase().includes(needle) ||
        c.topic.toLowerCase().includes(needle)
      )
    })
  }, [cards, q, topicFilter])

  return (
    <div className="page-wrap py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Library</p>
          <h1 className="display text-[28px]">Cards & topics</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">Search, filter, add, edit, delete. Changes persist locally.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setShowImport(true)}>
            <Upload size={16} /> Add cards
          </button>
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New card
          </button>
        </div>
      </div>

      <div className="card-flat p-4 mt-6 flex flex-col sm:flex-row gap-3">
        <label className="flex-1 flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
          <Search size={16} className="text-[var(--ink-faint)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions, answers, or topics…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--ink-faint)]"
          />
          {q && (
            <button onClick={() => setQ('')} className="text-[var(--ink-faint)]">
              <X size={14} />
            </button>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Filter size={16} className="text-[var(--ink-faint)]" />
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 ml-auto">
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              const data = exportToJson(cards.map((c) => ({ front: c.front, back: c.back, topic: c.topic })))
              download('circadia-cards.json', data)
            }}
          >
            <Download size={14} /> JSON
          </button>
          <button
            className="btn-ghost text-xs"
            onClick={() => {
              const data = exportToMarkdown(cards.map((c) => ({ front: c.front, back: c.back, topic: c.topic })))
              download('circadia-cards.md', data)
            }}
          >
            <Download size={14} /> Markdown
          </button>
        </div>
      </div>

      <div className="card-flat overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-xs tracking-wide uppercase text-[var(--ink-faint)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Front</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Back</th>
                <th className="text-left px-4 py-3 font-semibold">Topic</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Due</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">SM-2</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-[var(--line)] hover:bg-[var(--surface-muted)]">
                  <td className="px-4 py-3 max-w-[320px] truncate font-medium">{c.front}</td>
                  <td className="px-4 py-3 max-w-[280px] truncate hidden sm:table-cell text-[var(--ink-soft)]">{c.back}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-[var(--surface-muted)] border border-[var(--line)] px-2.5 py-1 text-xs font-medium">{c.topic}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[var(--ink-soft)]">{c.dueDate}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[var(--ink-faint)]">
                    {c.repetitions}·{c.interval}d·{c.easeFactor.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        aria-label="Edit"
                        onClick={() => setEditing(c)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[var(--line)] hover:bg-white"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        aria-label="Delete"
                        onClick={async () => {
                          await db.cards.delete(c.id)
                          refresh()
                        }}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-[var(--line)] hover:bg-white text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--ink-soft)]">
                    No cards match. Try a broader search or add a new card.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[var(--ink-faint)] mt-3">Showing {filtered.length} of {cards.length} cards · No pagination, all local.</p>

      {showAdd && <CardDialog onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {editing && <CardDialog card={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
      {showImport && <ImportWizard onClose={() => setShowImport(false)} onImported={refresh} />}
    </div>
  )
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

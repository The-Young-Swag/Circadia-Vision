import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { Card } from '#/db/dexie'
import { exportToJson, exportToMarkdown } from '#/lib/import'
import { cardRepository } from '#/repositories/cardRepository'
import { Search, Plus, Upload, Download, Filter, X } from 'lucide-react'
import { CardDialog } from '#/features/library/components/CardDialog'
import { ImportWizard } from '#/features/library/components/ImportWizard'
import { LibraryTable } from '#/features/library/components/LibraryTable'
import { useLibraryData } from '#/features/library/hooks/useLibraryData'

export const Route = createFileRoute('/library')({ component: Library })

function Library() {
  const { cards, refresh } = useLibraryData()
  const [q, setQ] = useState('')
  const [topicFilter, setTopicFilter] = useState<string>('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)

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
        <LibraryTable
          cards={filtered}
          onEdit={setEditing}
          onDelete={async (id) => {
            await cardRepository.delete(id)
            void refresh()
          }}
        />
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

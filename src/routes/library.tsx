import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { db, type Card } from '#/db/dexie'
import { autoSegment, exportToJson, exportToMarkdown, parseJsonImport } from '#/lib/import'
import { Search, Plus, Trash2, Pencil, Upload, Download, Filter, X } from 'lucide-react'

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
            <Upload size={16} /> Import
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
            placeholder="Search front, back, topic, email-style…"
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
      {showImport && <ImportDialog onClose={() => setShowImport(false)} onImported={refresh} />}
    </div>
  )
}

function CardDialog({ card, onClose, onSaved }: { card?: Card; onClose: () => void; onSaved: () => void }) {
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? '')
  const [topic, setTopic] = useState(card?.topic ?? 'General')
  const [targetDate, setTargetDate] = useState(card?.targetDate ?? '')

  const save = async () => {
    if (!front.trim() || !back.trim()) return
    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    if (card) {
      await db.cards.update(card.id, { front: front.trim(), back: back.trim(), topic: topic.trim() || 'General', targetDate: targetDate || undefined })
    } else {
      await db.cards.add({
        id: Math.random().toString(36).slice(2, 10),
        front: front.trim(),
        back: back.trim(),
        topic: topic.trim() || 'General',
        targetDate: targetDate || undefined,
        createdAt: now,
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: today,
      })
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="card-flat w-full max-w-[560px] p-6">
        <h3 className="font-semibold">{card ? 'Edit card' : 'New card'}</h3>
        <div className="grid gap-3 mt-4">
          <label className="text-sm">
            <span className="font-medium">Front</span>
            <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--blue)]" placeholder="Question or prompt" />
          </label>
          <label className="text-sm">
            <span className="font-medium">Back</span>
            <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm outline-none focus:border-[var(--blue)]" placeholder="Answer" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="font-medium">Topic</span>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none" />
            </label>
            <label className="text-sm">
              <span className="font-medium">Target date</span>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="mt-1 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none" />
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}

function ImportDialog({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [text, setText] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [preview, setPreview] = useState<ReturnType<typeof autoSegment>['cards']>([])

  const runPreview = () => {
    const r = text.trim().startsWith('{') || text.trim().startsWith('[') ? parseJsonImport(text) : autoSegment(text)
    setPreview(r.cards)
    setWarnings(r.warnings)
  }

  const doImport = async () => {
    const r = text.trim().startsWith('{') || text.trim().startsWith('[') ? parseJsonImport(text) : autoSegment(text)
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toISOString()
    const toAdd = r.cards.map((c) => ({
      id: Math.random().toString(36).slice(2, 10),
      front: c.front,
      back: c.back,
      topic: c.topic,
      createdAt: now,
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: today,
    }))
    if (toAdd.length) await db.cards.bulkAdd(toAdd as Card[])
    onImported()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="card-flat w-full max-w-[760px] max-h-[90vh] overflow-auto p-6">
        <h3 className="font-semibold">Import — paste text, markdown, or JSON</h3>
        <p className="text-sm text-[var(--ink-soft)] mt-1">Headers become topics. Bullets, Q/A pairs, and :: delimiters are auto-segmented. Edit before saving.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="mt-4 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm font-mono outline-none focus:border-[var(--blue)]"
          placeholder={`## Anatomy\nQ: What is ...?\nA: ...\n\n- Starling's law :: Stroke volume ...\n- Brachial plexus :: C5–T1\n\nOr paste JSON: {"cards":[{"front":"...","back":"...","topic":"..."}]}`}
        />
        <div className="flex gap-2 mt-3">
          <button className="btn-ghost" onClick={runPreview}>Preview</button>
          <button className="btn-primary" onClick={doImport} disabled={!text.trim()}>
            Import {preview.length ? `(${preview.length})` : ''}
          </button>
          <button className="btn-ghost ml-auto" onClick={onClose}>Close</button>
        </div>
        {warnings.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            {warnings.map((w) => (
              <div key={w}>• {w}</div>
            ))}
          </div>
        )}
        {preview.length > 0 && (
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <div className="text-sm font-medium mb-2">Preview — {preview.length} cards</div>
            <div className="grid gap-2 max-h-[260px] overflow-auto pr-1">
              {preview.slice(0, 20).map((c, i) => (
                <div key={i} className="rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
                  <div className="font-medium">{c.front}</div>
                  <div className="text-[var(--ink-soft)]">{c.back}</div>
                  <div className="text-xs text-[var(--ink-faint)] mt-1">{c.topic}</div>
                </div>
              ))}
              {preview.length > 20 && <div className="text-xs text-[var(--ink-faint)]">…and {preview.length - 20} more</div>}
            </div>
          </div>
        )}
      </div>
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

import { useMemo, useState } from 'react'
import {
  Download,
  Filter,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react'

import type { Card } from '#/shared/types/domain'
import {
  exportToJson,
  exportToMarkdown,
} from '#/shared/lib/import'

import {
  deleteCardAction,
} from '../actions'

import { CardDialog } from './CardDialog'
import { ImportWizard } from './ImportWizard'
import { LibraryTable } from './LibraryTable'
import { useLibraryData } from '../hooks/useLibraryData'

export function LibraryPage() {
  const { cards, ready } = useLibraryData()

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingCard, setEditingCard] =
    useState<Card | undefined>()

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return cards
    }

    return cards.filter((card) =>
      [card.front, card.back, card.topic]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query),
        ),
    )
  }, [cards, search])

  const handleCreate = () => {
    setEditingCard(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (card: Card) => {
    setEditingCard(card)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteCardAction(id)
  }

  const handleSaved = () => {
    setIsDialogOpen(false)
    setEditingCard(undefined)
  }

  const handleImported = () => {
    setIsImportOpen(false)
  }

  const handleExportJson = () => {
    exportToJson(cards)
  }

  const handleExportMarkdown = () => {
    exportToMarkdown(cards)
  }

  if (!ready) {
    return (
      <section className="page-wrap py-8">
        <div className="text-sm text-(--ink-faint)">
          Loading your library…
        </div>
      </section>
    )
  }

  return (
    <section className="page-wrap py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Library</p>

          <h1 className="display mt-2 text-3xl tracking-tight">
            Your knowledge
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-(--ink-soft)">
            Manage the cards that power your adaptive review sessions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--ink) px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          Add card
        </button>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ink-faint)"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search cards..."
            className="w-full rounded-lg border border-(--line) bg-(--surface) py-2.5 pl-9 pr-9 text-sm text-(--ink) outline-none placeholder:text-(--ink-faint) focus:border-(--ink-soft)"
          />

          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-(--ink-faint) hover:text-(--ink)"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={() =>
            setShowFilters((current) => !current)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-(--line) bg-(--surface) px-4 py-2.5 text-sm text-(--ink-soft) hover:text-(--ink)"
        >
          <Filter size={16} />
          Filters
        </button>

        <button
          type="button"
          onClick={() => setIsImportOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-(--line) bg-(--surface) px-4 py-2.5 text-sm text-(--ink-soft) hover:text-(--ink)"
        >
          <Upload size={16} />
          Import
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-(--line) bg-(--surface) px-3 py-2.5 text-sm text-(--ink-soft) hover:text-(--ink)"
            title="Export JSON"
          >
            <Download size={16} />

            <span className="hidden sm:inline">
              JSON
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-(--line) bg-(--surface) px-3 py-2.5 text-sm text-(--ink-soft) hover:text-(--ink)"
            title="Export Markdown"
          >
            <Download size={16} />

            <span className="hidden sm:inline">
              Markdown
            </span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-lg border border-(--line) bg-(--surface) p-4">
          <p className="text-sm text-(--ink-soft)">
            Filtering options will be added here as library
            requirements evolve.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-(--line) bg-(--surface)">
        <LibraryTable
          cards={filteredCards}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {isDialogOpen && (
        <CardDialog
          card={editingCard}
          onClose={() => {
            setIsDialogOpen(false)
            setEditingCard(undefined)
          }}
          onSaved={handleSaved}
        />
      )}

      {isImportOpen && (
        <ImportWizard
          onClose={() => setIsImportOpen(false)}
          onImported={handleImported}
        />
      )}
    </section>
  )
}
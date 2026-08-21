import { useEffect, useState, useTransition } from 'react'
import type { Card } from '#/shared/lib/db/dexie'
import { cardRepository } from '#/shared/repositories/cardRepository'

type CardDialogProps = {
  card?: Card
  onClose: () => void
  onSaved: () => void
}

// Pure: UI = f(card). Local form state is owned here, synced when card identity changes.
export function CardDialog({ card, onClose, onSaved }: CardDialogProps) {
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? '')
  const [topic, setTopic] = useState(card?.topic ?? 'General')
  const [targetDate, setTargetDate] = useState(card?.targetDate ?? '')
  const [isPending, startTransition] = useTransition()

  // Keep derived state in sync when editing a different card (avoid stale duplication)
  useEffect(() => {
    setFront(card?.front ?? '')
    setBack(card?.back ?? '')
    setTopic(card?.topic ?? 'General')
    setTargetDate(card?.targetDate ?? '')
  }, [card?.id, card?.front, card?.back, card?.topic, card?.targetDate])

  const save = () => {
    if (!front.trim() || !back.trim()) return
    startTransition(async () => {
      const now = new Date().toISOString()
      const today = now.slice(0, 10)
      if (card) {
        await cardRepository.update(card.id, {
          front: front.trim(),
          back: back.trim(),
          topic: topic.trim() || 'General',
          targetDate: targetDate || undefined,
        })
      } else {
        await cardRepository.create({
          id: crypto.randomUUID().slice(0, 8),
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
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-label={card ? 'Edit card' : 'New card'}
      onClick={onClose}
    >
      <div
        className="card-flat w-full max-w-[560px] p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-[17px]">
          {card ? 'Edit card' : 'Create a new card'}
        </h3>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          {card
            ? 'Make changes and save. It will update right away.'
            : 'One idea per card works best. You can add many more after.'}
        </p>
        <div className="grid gap-4 mt-5">
          <label className="text-sm">
            <span className="font-medium">Front — what you’ll see first</span>
            <span className="text-[var(--ink-faint)] font-normal">
              {' '}
              (question, prompt, word)
            </span>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[15px] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20"
              placeholder="e.g. What is the primary neurotransmitter at the neuromuscular junction?"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Back — the answer</span>
            <span className="text-[var(--ink-faint)] font-normal">
              {' '}
              (keep it concise)
            </span>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[15px] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20"
              placeholder="e.g. Acetylcholine — released at the neuromuscular junction"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="font-medium">Topic</span>
              <span className="text-[var(--ink-faint)] font-normal">
                {' '}
                (groups your cards)
              </span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                list="topic-suggestions"
                className="mt-1.5 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--blue)]"
                placeholder="General"
              />
              <datalist id="topic-suggestions">
                <option value="General" />
                <option value="Anatomy" />
                <option value="Physiology" />
                <option value="Pharmacology" />
              </datalist>
            </label>
            <label className="text-sm">
              <span className="font-medium">Target date</span>
              <span className="text-[var(--ink-faint)] font-normal">
                {' '}
                (optional)
              </span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1.5 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm outline-none"
              />
            </label>
          </div>
          <p className="text-xs text-[var(--ink-faint)]">
            Tip: Good cards are short and test one idea. You can always edit
            later.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={save}
            disabled={!front.trim() || !back.trim() || isPending}
          >
            {isPending ? 'Saving…' : card ? 'Save changes' : 'Add card'}
          </button>
        </div>
      </div>
    </div>
  )
}

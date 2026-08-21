/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Card } from '#/shared/types/domain'
import { parseAny  } from '#/shared/lib/import'
import type {RawCard} from '#/shared/lib/import';
import { cardRepository } from '#/shared/repositories/cardRepository'
import {
  Upload,
  FileText,
  Sparkles,
  X,
  Plus,
  Trash2,
  Check,
  Info,
  ChevronDown,
} from 'lucide-react'

// Templates — plain-language examples anyone can use
const TEMPLATES: Record<
  string,
  { label: string; hint: string; content: string }
> = {
  notes: {
    label: 'Class notes',
    hint: 'Bullets or headings — simplest',
    content: `My Biology Notes

Photosynthesis :: How plants make food from sunlight and CO2
Mitosis :: Cell division that makes two identical cells
DNA :: Carries genetic information in every cell

Study tips
- Review a little each day
- Test yourself without looking`,
  },
  vocab: {
    label: 'Vocab Q&A',
    hint: 'Questions and answers',
    content: `Q: What does "photosynthesis" mean?
A: How plants use sunlight to make food

Q: What is mitosis?
A: When one cell splits into two identical cells

Q: Where is DNA found?
A: In the nucleus of every cell`,
  },
  list: {
    label: 'Simple list',
    hint: 'One idea per line',
    content: `Capital of France :: Paris
Largest planet :: Jupiter
Water formula :: H2O
Speed of light :: 299,792 km per second`,
  },
  sample: {
    label: 'Try a sample',
    hint: 'Medical review — full example',
    content: `## Anatomy
What is the primary neurotransmitter at the neuromuscular junction? :: Acetylcholine
Which nerve innervates the thenar eminence? :: Median nerve

## Pharmacology
ACE inhibitors — how do they work? :: Block angiotensin I → II
Warfarin antidote :: Vitamin K`,
  },
}

const SUPPORTED = '.txt, .md, .json, .csv'

function humanWarning(w: string): string {
  if (w.includes('No content'))
    return 'Your paste area is empty — add some text or try a template above.'
  if (w.includes('No cards detected'))
    return 'We couldn’t find cards yet. Try one idea per line, or use “Question :: Answer”.'
  if (w.includes('Duplicate skipped'))
    return w.replace('Duplicate skipped', 'Skipped duplicate')
  if (w.includes('Invalid JSON'))
    return 'That JSON doesn’t look right — check it has front and back for each card.'
  if (w.includes('JSON parse'))
    return 'We couldn’t read that JSON — it might be missing a bracket or quote.'
  if (w.includes('CSV')) return w
  return w
}

export function ImportWizard({
  onClose,
  onImported,
}: {
  onClose: () => void
  onImported: () => void
}) {
  const [mode, setMode] = useState<'paste' | 'file'>('paste')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debounced text for preview to avoid thrash
  const [debounced, setDebounced] = useState(text)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(text), 300)
    return () => clearTimeout(id)
  }, [text])

  const parsed = useMemo(() => parseAny(debounced), [debounced])
  const [editable, setEditable] = useState<RawCard[]>([])

  // Sync preview when parsed changes (but keep user edits if they edited)
  const prevTextRef = useRef('')
  useEffect(() => {
    // If user is typing and we haven't edited manually, mirror parsed
    if (debounced !== prevTextRef.current) {
      prevTextRef.current = debounced
      setEditable(parsed.cards)
    }
  }, [parsed.cards, debounced])

  const warnings = parsed.warnings.map(humanWarning)
  const canImport =
    editable.length > 0 &&
    editable.every((c) => c.front.trim() && c.back.trim())

  const loadFile = async (file: File) => {
    const content = await file.text()
    setFileName(file.name)
    setText(content)
    setMode('paste') // show preview in paste area so user can edit
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files.item(0)
    if (file) await loadFile(file)
  }

  const onFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0) ?? null
    if (file) await loadFile(file)
  }

  const useTemplate = (key: string) => {
    const t = TEMPLATES[key]
    if (t) setText(t.content)
  }

  const updateCard = (idx: number, patch: Partial<RawCard>) => {
    setEditable((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    )
  }
  const removeCard = (idx: number) =>
    setEditable((p) => p.filter((_, i) => i !== idx))
  const addBlank = () =>
    setEditable((p) => [...p, { front: '', back: '', topic: 'General' }])

  const doImport = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toISOString()
    const toAdd: Card[] = editable
      .filter((c) => c.front.trim() && c.back.trim())
      .map((c) => ({
        id: crypto.randomUUID().slice(0, 8),
        front: c.front.trim(),
        back: c.back.trim(),
        topic: c.topic.trim() || 'General',
        createdAt: now,
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: today,
      }))
    if (toAdd.length) await cardRepository.createMany(toAdd)
    onImported()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Add cards to your library"
      onClick={onClose}
    >
      <div
        className="card-flat w-full max-w-220 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — friendly, not technical */}
        <div className="px-6 pt-6 pb-4 border-b border-(--line) shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="display text-[22px] leading-tight flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-(--ink) text-white grid place-items-center">
                  <Sparkles size={16} />
                </span>{' '}
                Add to your library
              </h2>
              <p className="text-sm text-(--ink-soft) mt-2 leading-relaxed max-w-[60ch]">
                Paste whatever you have — notes, lists, questions — or upload a
                file. We’ll turn it into study cards you can tweak before
                saving. No special formatting needed.
              </p>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-full border border-(--line) hover:bg-(--surface-muted) shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode switch — large, inclusive */}
          <div className="mt-5 inline-flex rounded-full border border-(--line) bg-(--surface-muted) p-1">
            <button
              onClick={() => setMode('paste')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'paste' ? 'bg-white border border-(--line) shadow-sm text-(--ink)' : 'text-(--ink-soft)'}`}
            >
              <FileText size={16} /> Paste notes
            </button>
            <button
              onClick={() => setMode('file')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'file' ? 'bg-white border border-(--line) shadow-sm text-(--ink)' : 'text-(--ink-soft)'}`}
            >
              <Upload size={16} /> Upload file
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <div className="p-6 space-y-5">
            {mode === 'paste' ? (
              <>
                {/* Templates — one-tap help for anyone */}
                <div>
                  <div className="text-xs font-semibold tracking-wide uppercase text-(--ink-faint)">
                    Start with an example — tap to try
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(TEMPLATES).map(([k, t]) => (
                      <button
                        key={k}
                        onClick={() => useTemplate(k)}
                        className="text-left rounded-xl border border-(--line) bg-white p-3 hover:border-(--blue) hover:bg-sky-50/50 transition group"
                      >
                        <div className="text-sm font-semibold group-hover:text-(--blue)">
                          {t.label}
                        </div>
                        <div className="text-xs text-(--ink-faint) mt-0.5">
                          {t.hint}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium">Your notes</span>
                  <span className="text-xs text-(--ink-faint) ml-2">
                    Paste however they are — we’ll sort it
                  </span>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={9}
                    className="mt-2 w-full rounded-xl border border-(--line) bg-(--surface-muted) p-4 text-[15px] leading-relaxed outline-none focus:border-(--blue) focus:bg-white placeholder:text-(--ink-faint)"
                    placeholder={`Try:

Photosynthesis :: How plants make food
Mitosis :: Cell division

Or:
Q: What is photosynthesis?
A: How plants use sunlight

Or just one fact per line — we’ll handle the rest.`}
                  />
                  <span className="text-xs text-(--ink-faint) mt-1.5 block">
                    Tip: One idea per line works great. You can also use
                    “Question :: Answer”.
                  </span>
                </label>

                <button
                  onClick={() => setShowTips((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-(--ink-soft) hover:text-(--ink)"
                >
                  <Info size={14} /> How it works{' '}
                  <ChevronDown
                    size={12}
                    className={`transition ${showTips ? 'rotate-180' : ''}`}
                  />
                </button>
                {showTips && (
                  <div className="rounded-xl border border-(--line) bg-(--surface-muted) p-4 text-sm leading-relaxed text-(--ink-soft)">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <strong>Headings become topics</strong> — Start a line
                        with{' '}
                        <code className="rounded bg-white px-1.5 py-0.5 border">
                          ## Biology
                        </code>{' '}
                        to group cards.
                      </li>
                      <li>
                        <strong>Bullets become cards</strong> — Each{' '}
                        <code className="rounded bg-white px-1.5 py-0.5 border">
                          - Idea
                        </code>{' '}
                        is a card.
                      </li>
                      <li>
                        <strong>Separators split front/back</strong> —{' '}
                        <code className="rounded bg-white px-1.5 py-0.5 border">
                          ::
                        </code>
                        ,{' '}
                        <code className="rounded bg-white px-1.5 py-0.5 border">
                          -&gt;
                        </code>{' '}
                        or simply write a question.
                      </li>
                      <li>
                        CSV and JSON files work too — just upload and we’ll read
                        them.
                      </li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${dragOver ? 'border-(--blue) bg-sky-50' : 'border-(--line) hover:border-(--line-strong) bg-white'}`}
                >
                  <div className="mx-auto h-10 w-10 rounded-full bg-white border border-(--line) grid place-items-center">
                    <Upload size={18} />
                  </div>
                  <div className="font-medium mt-3">
                    Drop your file here or click to browse
                  </div>
                  <div className="text-sm text-(--ink-faint) mt-1">
                    Supported: {SUPPORTED} · Your data stays on this device
                  </div>
                  {fileName && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white border border-(--line) px-3 py-1.5 text-sm">
                      <FileText size={14} /> {fileName}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.markdown,.json,.csv"
                    className="hidden"
                    onChange={onFilePick}
                  />
                </div>
                {text && (
                  <div className="rounded-xl border border-(--line) bg-white p-3">
                    <div className="text-xs font-semibold text-(--ink-faint) tracking-wide uppercase">
                      File contents — you can still edit
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      className="mt-2 w-full rounded-xl border border-(--line) bg-(--surface-muted) p-3 text-sm font-mono outline-none"
                    />
                  </div>
                )}
              </>
            )}

            {/* Live preview — the real inclusivity: see before you save, edit anything */}
            <div className="border-t border-(--line) pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  Preview{' '}
                  <span className="rounded-full bg-(--surface-muted) border border-(--line) px-2.5 py-0.5 text-xs font-medium">
                    {editable.length} card{editable.length === 1 ? '' : 's'}{' '}
                    found
                  </span>
                  {editable.length > 0 && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1">
                      <Check size={12} /> Ready to edit
                    </span>
                  )}
                </h3>
                {editable.length > 0 && (
                  <button
                    onClick={addBlank}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--line) bg-white px-3 py-1.5 text-xs font-medium hover:bg-(--surface-muted)"
                  >
                    <Plus size={12} /> Add card
                  </button>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {warnings.map((w) => (
                    <div key={w} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {editable.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-(--line) bg-(--surface-muted) p-8 text-center">
                  <div className="text-sm font-medium">No cards yet</div>
                  <div className="text-sm text-(--ink-soft) mt-1 max-w-[40ch] mx-auto">
                    Paste some notes above or try an example. Each card has a
                    front (question) and a back (answer) — you’ll be able to
                    tweak every one.
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 max-h-90 overflow-auto pr-1">
                  {editable.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-(--line) bg-white p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wide uppercase text-(--ink-faint)">
                          Card {i + 1}
                        </span>
                        <button
                          aria-label={`Remove card ${i + 1}`}
                          onClick={() => removeCard(i)}
                          className="h-7 w-7 grid place-items-center rounded-full border border-transparent hover:border-(--line) hover:bg-(--surface-muted) text-(--ink-faint)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2.5">
                        <label className="text-xs font-medium">
                          <span className="text-(--ink-faint)">Front</span>
                          <textarea
                            value={c.front}
                            onChange={(e) =>
                              updateCard(i, { front: e.target.value })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-xl border border-(--line) bg-(--surface) p-2.5 text-sm outline-none focus:border-(--blue)"
                            placeholder="Question or prompt"
                          />
                        </label>
                        <label className="text-xs font-medium">
                          <span className="text-(--ink-faint)">Back</span>
                          <textarea
                            value={c.back}
                            onChange={(e) =>
                              updateCard(i, { back: e.target.value })
                            }
                            rows={2}
                            className="mt-1 w-full rounded-xl border border-(--line) bg-(--surface) p-2.5 text-sm outline-none focus:border-(--blue)"
                            placeholder="Answer"
                          />
                        </label>
                        <label className="text-xs font-medium max-w-60">
                          <span className="text-(--ink-faint)">Topic</span>
                          <input
                            value={c.topic}
                            onChange={(e) =>
                              updateCard(i, { topic: e.target.value })
                            }
                            className="mt-1 w-full rounded-full border border-(--line) bg-(--surface) px-3 py-1.5 text-sm outline-none focus:border-(--blue)"
                            placeholder="General"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {editable.length > 20 && (
                <p className="text-xs text-(--ink-faint) mt-2">
                  Showing all {editable.length} cards — they’ll all be added.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer — calm, predictable */}
        <div className="shrink-0 border-t border-(--line) bg-(--surface-muted) px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button className="btn-ghost bg-white" onClick={onClose}>
            Cancel
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button
              className="btn-ghost bg-white"
              onClick={() => {
                setText('')
                setFileName(null)
              }}
            >
              Clear all
            </button>
            <button
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              onClick={doImport}
              disabled={!canImport}
            >
              <Check size={16} /> Add{' '}
              {editable.length
                ? `${editable.length} card${editable.length === 1 ? '' : 's'}`
                : 'cards'}{' '}
              to library
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Import — paste plain text/markdown, auto-segment into atomic cards.
 * Heuristics: headers, bullet boundaries, Q/A pairs, double-newline blocks.
 * Manual edit before saving; no lock-in.
 */

export type RawCard = {
  front: string
  back: string
  topic: string
}

export type ImportResult = {
  cards: RawCard[]
  warnings: string[]
}

/**
 * Auto-segment plain text / markdown into cards.
 * - Splits on ##/??? headers as topic boundaries
 * - Within each topic, splits on:
 *   - `Q: ... A: ...` pairs (case-insensitive)
 *   - `front :: back` or `front -> back` or `front — back`
 *   - bullet lines (`-`, `*`, `•`) as individual cards with auto backs
 *   - double-newline blocks as front/back if contains `?`
 */
export function autoSegment(input: string, fallbackTopic = 'General'): ImportResult {
  const warnings: string[] = []
  const cards: RawCard[] = []
  const text = input.trim()
  if (!text) return { cards, warnings: ['No content to import.'] }

  // Split by headers to get topic chunks
  const headerRegex = /^#{1,6}\s+(.+)$/gm
  const topics: { topic: string; body: string }[] = []
  let lastIdx = 0
  let lastTopic = fallbackTopic
  let m: RegExpExecArray | null

  // Extract headers positions
  const positions: { idx: number; topic: string }[] = []
  while ((m = headerRegex.exec(text))) {
    positions.push({ idx: m.index, topic: m[1]!.trim() })
  }

  if (positions.length === 0) {
    topics.push({ topic: fallbackTopic, body: text })
  } else {
    // handle pre-header content
    if (positions[0]!.idx > 0) {
      topics.push({ topic: fallbackTopic, body: text.slice(0, positions[0]!.idx) })
    }
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i]!.idx
      const end = i + 1 < positions.length ? positions[i + 1]!.idx : text.length
      // header line itself is topic, body is after it
      const headerLineEnd = text.indexOf('\n', start)
      const bodyStart = headerLineEnd === -1 ? end : headerLineEnd + 1
      topics.push({
        topic: positions[i]!.topic,
        body: text.slice(bodyStart, end),
      })
    }
    // cleanup: remove header markers from bodies (already did)
  }

  for (const { topic, body } of topics) {
    const chunkCards = segmentBody(body, topic)
    cards.push(...chunkCards)
  }

  // Dedupe by front exact
  const seen = new Set<string>()
  const deduped: RawCard[] = []
  for (const c of cards) {
    const key = c.front.trim().toLowerCase()
    if (!key) continue
    if (seen.has(key)) {
      warnings.push(`Duplicate skipped: "${c.front.slice(0, 40)}"`)
      continue
    }
    seen.add(key)
    deduped.push({ front: c.front.trim(), back: c.back.trim(), topic: c.topic })
  }

  if (deduped.length === 0) warnings.push('No cards detected — try Q/A or bullet format.')
  if (deduped.length > 200) warnings.push('Large import — consider splitting into smaller sets.')

  return { cards: deduped, warnings }
}

function segmentBody(body: string, topic: string): RawCard[] {
  const cards: RawCard[] = []
  const trimmed = body.trim()
  if (!trimmed) return cards

  // 1) Q: / A: pairs
  const qaRegex = /Q\s*:\s*(.+?)\s*\n\s*A\s*:\s*(.+?)(?=\n\s*Q\s*:|$)/gis
  let qaFound = false
  let qm: RegExpExecArray | null
  while ((qm = qaRegex.exec(trimmed))) {
    qaFound = true
    cards.push({ front: qm[1]!.trim(), back: qm[2]!.trim(), topic })
  }
  if (qaFound) return cards

  // 2) Split by double newlines into blocks
  const blocks = trimmed.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)

  for (const block of blocks) {
    // 2a) Delimiters ::, ->, —, —
    const delim = block.match(/^(.+?)\s*(::|->|—|—|–|:)\s*(.+)$/s)
    if (delim && delim[1]!.length < 200 && delim[3]!.length < 800) {
      // ensure not just a bullet list block
      if (!block.includes('\n- ') && !block.includes('\n* ')) {
        cards.push({ front: delim[1]!.trim(), back: delim[3]!.trim(), topic })
        continue
      }
    }

    // 2b) Bullet list: each bullet = card (front = bullet, back = placeholder to fill)
    if (block.match(/^[-*•]\s+/m)) {
      const bullets = block.split(/\n/).map((l) => l.replace(/^[-*•]\s+/, '').trim()).filter(Boolean)
      for (const b of bullets) {
        // if bullet contains :: split, else back is "Define: <bullet>"
        const inner = b.match(/^(.+?)\s*(::|->|:)\s*(.+)$/)
        if (inner) cards.push({ front: inner[1]!.trim(), back: inner[3]!.trim(), topic })
        else cards.push({ front: b, back: `Define: ${b}`, topic })
      }
      continue
    }

    // 2c) Single block with ? -> front=block, back=next block? Not reliable.
    // Fall back: treat block as front, ask user to fill back manually.
    // But if block is short Q? Use it as front with empty back prompt.
    if (block.length < 400) {
      if (block.includes('?')) {
        const parts = block.split('?')
        const q = parts[0]! + '?'
        const a = parts.slice(1).join('?').trim() || 'Answer…'
        cards.push({ front: q.trim(), back: a, topic })
      } else {
        cards.push({ front: block, back: '…', topic })
      }
    } else {
      // long prose: split by sentences into cards
      const sentences = block.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20)
      for (const s of sentences.slice(0, 8)) {
        cards.push({ front: s.trim(), back: 'Explain in your own words.', topic })
      }
    }
  }

  return cards
}

export function exportToJson(cards: RawCard[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), cards }, null, 2)
}

export function exportToMarkdown(cards: RawCard[]): string {
  // Group by topic
  const byTopic = new Map<string, RawCard[]>()
  for (const c of cards) {
    const arr = byTopic.get(c.topic) ?? []
    arr.push(c)
    byTopic.set(c.topic, arr)
  }
  const lines: string[] = []
  for (const [topic, list] of byTopic) {
    lines.push(`## ${topic}`, '')
    for (const c of list) {
      lines.push(`Q: ${c.front}`, `A: ${c.back}`, '')
    }
  }
  return lines.join('\n').trim() + '\n'
}

export function parseJsonImport(json: string): ImportResult {
  try {
    const data = JSON.parse(json)
    const raw = Array.isArray(data) ? data : data.cards
    if (!Array.isArray(raw)) return { cards: [], warnings: ['Invalid JSON: expected array or {cards}.'] }
    const cards: RawCard[] = raw
      .filter((c: unknown) => c && typeof c === 'object' && 'front' in (c as Record<string, unknown>) && 'back' in (c as Record<string, unknown>))
      .map((c: Record<string, unknown>) => ({
        front: String(c.front),
        back: String(c.back),
        topic: String(c.topic ?? 'General'),
      }))
    return { cards, warnings: [] }
  } catch (e) {
    return { cards: [], warnings: [`JSON parse error: ${(e as Error).message}`] }
  }
}

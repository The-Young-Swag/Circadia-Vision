import { db, type Card } from '#/db/dexie'

// Repository owns persistence — Drizzle/Dexie never leaks to UI directly (Guide §25)
// UI → Service → Repository → Dexie → IndexedDB
// If we later migrate IndexedDB → SQLite WASM, only this file changes.

export const cardRepository = {
  async findAll(): Promise<Card[]> {
    return db.cards.toArray()
  },

  async findDue(todayISO: string): Promise<Card[]> {
    return db.cards.where('dueDate').belowOrEqual(todayISO).toArray()
  },

  async findById(id: string): Promise<Card | undefined> {
    return db.cards.get(id)
  },

  async create(card: Card): Promise<void> {
    await db.cards.add(card)
  },

  async createMany(cards: Card[]): Promise<void> {
    if (cards.length) await db.cards.bulkAdd(cards)
  },

  async update(id: string, patch: Partial<Card>): Promise<void> {
    await db.cards.update(id, patch)
  },

  async delete(id: string): Promise<void> {
    await db.cards.delete(id)
  },

  async count(): Promise<number> {
    return db.cards.count()
  },
}

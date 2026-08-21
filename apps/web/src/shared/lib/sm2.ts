/**
 * SM-2 scheduler — pure, testable, no side-effects.
 * Based on SuperMemo SM-2 with modern clamping.
 *
 * Grades: 0 = Again (fail), 1 = Hard, 2 = Good, 3 = Easy
 * Maps internally to SM-2 q values: 0, 3, 4, 5
 */

export type Grade = 0 | 1 | 2 | 3

export type SM2State = {
  interval: number // days
  repetitions: number
  easeFactor: number
}

export type SM2Result = SM2State & {
  dueDate: string // YYYY-MM-DD
}

const GRADE_TO_Q: Record<Grade, number> = {
  0: 0,
  1: 3,
  2: 4,
  3: 5,
}

const MIN_EASE = 1.3

export function gradeToQ(grade: Grade): number {
  return GRADE_TO_Q[grade]
}

/**
 * One step of SM-2. Pure function.
 * @param state current SM-2 state
 * @param grade user grade
 * @param now optional now for deterministic dueDate (defaults to today)
 */
export function sm2(
  state: SM2State,
  grade: Grade,
  now: Date = new Date(),
): SM2Result {
  const q = gradeToQ(grade)
  let { interval, repetitions, easeFactor } = state

  if (q < 3) {
    // Failed recall — reset
    repetitions = 0
    interval = 1
  } else {
    // Good recall — advance
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)

    repetitions += 1
  }

  // Update ease factor (even on failure, SM-2 updates)
  easeFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE

  // Due date = today + interval days
  const due = new Date(now)
  due.setDate(due.getDate() + interval)
  const dueDate = toISODate(due)

  return { interval, repetitions, easeFactor: round2(easeFactor), dueDate }
}

export function initialState(): SM2State {
  return { interval: 0, repetitions: 0, easeFactor: 2.5 }
}

export function isDue(cardDueDate: string, today: Date = new Date()): boolean {
  return toISODate(today) >= cardDueDate
}

export function daysOverdue(cardDueDate: string, today: Date = new Date()): number {
  const due = new Date(cardDueDate + 'T00:00:00')
  const t = new Date(toISODate(today) + 'T00:00:00')
  const diff = (t.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.floor(diff))
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Utility: sort cards by due status and recall confidence.
 * High confidence = high repetitions + high ease + not overdue.
 */
export function confidenceScore(card: {
  repetitions: number
  easeFactor: number
  interval: number
  dueDate: string
}): number {
  const overdue = daysOverdue(card.dueDate)
  // Higher is more confident (mastered). Overdue penalizes.
  return card.repetitions * 2 + card.easeFactor - overdue * 0.5
}

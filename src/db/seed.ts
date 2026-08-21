import { db, type Card } from '#/db/dexie'
import { faker } from '@faker-js/faker'

const TOPICS = [
  'Anatomy',
  'Pharmacology',
  'Biochemistry',
  'Pathology',
  'Physiology',
  'Microbiology',
] as const

function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const SAMPLE_CARDS: Array<{ front: string; back: string; topic: string }> = [
  { front: 'What is the primary neurotransmitter at the neuromuscular junction?', back: 'Acetylcholine', topic: 'Physiology' },
  { front: 'Which nerve innervates the thenar eminence?', back: 'Median nerve (recurrent branch)', topic: 'Anatomy' },
  { front: 'MOA of ACE inhibitors', back: 'Block conversion of angiotensin I → II; reduce vasoconstriction & aldosterone', topic: 'Pharmacology' },
  { front: 'Rate-limiting enzyme of glycolysis', back: 'Phosphofructokinase-1 (PFK-1)', topic: 'Biochemistry' },
  { front: 'Reed-Sternberg cells are hallmark of…', back: 'Hodgkin lymphoma', topic: 'Pathology' },
  { front: 'Gram-positive diplococci in pairs', back: 'Streptococcus pneumoniae', topic: 'Microbiology' },
  { front: 'Starling’s law of the heart', back: 'Stroke volume ↑ with ↑ end-diastolic volume (within limits)', topic: 'Physiology' },
  { front: 'Brachial plexus: roots', back: 'C5–T1', topic: 'Anatomy' },
  { front: 'Warfarin antidote', back: 'Vitamin K; 4F-PCC for severe bleeding', topic: 'Pharmacology' },
  { front: 'HMP shunt main purpose', back: 'NADPH production & ribose-5-phosphate', topic: 'Biochemistry' },
  { front: 'Caseating granulomas → ?', back: 'Tuberculosis', topic: 'Pathology' },
  { front: 'Catalase-positive, coagulase-positive cocci', back: 'Staphylococcus aureus', topic: 'Microbiology' },
  { front: 'Frank-Starling: afterload effect', back: '↑ afterload → ↓ stroke volume', topic: 'Physiology' },
  { front: 'Rotator cuff muscles (SITS)', back: 'Supraspinatus, Infraspinatus, Teres minor, Subscapularis', topic: 'Anatomy' },
  { front: 'Metformin MOA', back: '↓ hepatic gluconeogenesis; ↑ insulin sensitivity (AMPK)', topic: 'Pharmacology' },
  { front: 'Essential fatty acids', back: 'Linoleic (ω-6) & α-linolenic (ω-3)', topic: 'Biochemistry' },
]

function randomSM2() {
  const repetitions = faker.number.int({ min: 0, max: 6 })
  const easeFactor = Number(faker.number.float({ min: 1.3, max: 2.8 }).toFixed(2))
  const interval = repetitions === 0 ? 0 : [1, 6, 12, 24, 45, 90][Math.min(repetitions, 5)]!
  const dueOffset = faker.helpers.arrayElement([-3, -1, 0, 0, 1, 2, 4, 7])
  return { repetitions, easeFactor, interval, dueDate: isoDate(dueOffset) }
}

export async function seedIfEmpty(): Promise<void> {
  const count = await db.cards.count()
  if (count > 0) return

  const cards: Card[] = SAMPLE_CARDS.map((s) => {
    const sm = randomSM2()
    return {
      id: uid(),
      front: s.front,
      back: s.back,
      topic: s.topic,
      createdAt: new Date(Date.now() - faker.number.int({ min: 0, max: 20 }) * 86400000).toISOString(),
      interval: sm.interval,
      repetitions: sm.repetitions,
      easeFactor: sm.easeFactor,
      dueDate: sm.dueDate,
    }
  })

  // Add some extra generated cards for volume
  for (let i = 0; i < 18; i++) {
    const topic = faker.helpers.arrayElement(TOPICS)
    const sm = randomSM2()
    cards.push({
      id: uid(),
      front: faker.helpers.arrayElement([
        `Define: ${faker.lorem.words(3)}`,
        `What is ${faker.lorem.words(2)}?`,
        `${faker.lorem.words(4)} — mechanism?`,
      ]),
      back: faker.lorem.sentence({ min: 6, max: 12 }),
      topic,
      targetDate: Math.random() > 0.7 ? isoDate(faker.number.int({ min: 7, max: 30 })) : undefined,
      createdAt: new Date().toISOString(),
      interval: sm.interval,
      repetitions: sm.repetitions,
      easeFactor: sm.easeFactor,
      dueDate: sm.dueDate,
    })
  }

  await db.cards.bulkAdd(cards)

  // Seed review sessions (past 14 days)
  const sessions: Array<{
    id: string
    cardId: string
    sessionId: string
    timestamp: string
    grade: number
  }> = []
  const allCards = await db.cards.toArray()
  for (let day = 13; day >= 0; day--) {
    const perDay = faker.number.int({ min: 2, max: 8 })
    const sessionId = `seed-${day}-${uid()}`
    for (let j = 0; j < perDay; j++) {
      const card = faker.helpers.arrayElement(allCards)
      const ts = new Date()
      ts.setDate(ts.getDate() - day)
      ts.setHours(faker.number.int({ min: 9, max: 22 }), faker.number.int({ min: 0, max: 59 }))
      sessions.push({
        id: uid(),
        cardId: card.id,
        sessionId,
        timestamp: ts.toISOString(),
        grade: faker.helpers.weightedArrayElement([
          { weight: 6, value: 2 },
          { weight: 3, value: 3 },
          { weight: 2, value: 1 },
          { weight: 1, value: 0 },
        ]),
      })
    }
  }
  await db.reviewSessions.bulkAdd(sessions)

  // Seed baseline features (pretend 10 sessions already calibrated)
  const { DEFAULT_ALPHA } = await import('#/lib/baseline')
  void DEFAULT_ALPHA
  await db.baselineFeatures.bulkAdd([
    { name: 'interKeyLatency', mean: 118, variance: 420, stddev: 20.5, sampleCount: 12, lastUpdated: new Date().toISOString() },
    { name: 'dwellTime', mean: 92, variance: 180, stddev: 13.4, sampleCount: 12, lastUpdated: new Date().toISOString() },
    { name: 'correctionRate', mean: 0.06, variance: 0.0012, stddev: 0.034, sampleCount: 12, lastUpdated: new Date().toISOString() },
    { name: 'wpm', mean: 62, variance: 85, stddev: 9.2, sampleCount: 12, lastUpdated: new Date().toISOString() },
  ])

  // Seed session signals (last 3 sessions, 10 mins each)
  const sigs: Array<Record<string, unknown>> = []
  const now = Date.now()
  for (let s = 0; s < 3; s++) {
    const sid = `seed-sess-${s}`
    for (let m = 0; m < 10; m++) {
      sigs.push({
        id: uid(),
        sessionId: sid,
        minuteIndex: m,
        timestamp: new Date(now - (3 - s) * 86400000 - (10 - m) * 60000).toISOString(),
        interKeyLatency: 115 + faker.number.float({ min: -12, max: 18 }),
        dwellTime: 88 + faker.number.float({ min: -8, max: 12 }),
        correctionRate: 0.05 + faker.number.float({ min: -0.02, max: 0.04 }),
        wpm: 60 + faker.number.float({ min: -8, max: 10 }),
      })
    }
  }
  await db.sessionSignals.bulkAdd(sigs as never)

  // Seed one insight
  await db.insights.add({
    id: uid(),
    statement: 'Accuracy on new material dips after ~20 minutes',
    stat: '78% early → 54% after 20m',
    timestamp: new Date().toISOString(),
    dismissed: false,
    kind: 'focus',
  })

  await db.appSettings.put({ key: 'hasSeenOnboarding', value: JSON.stringify(true) })
  await db.appSettings.put({ key: 'adaptiveOptIn', value: JSON.stringify(true) })
  await db.appSettings.put({ key: 'calibrationSessions', value: JSON.stringify(12) })
}

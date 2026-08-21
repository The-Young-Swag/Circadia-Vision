import { db } from '#/shared/lib/db/dexie'
import type { Card } from '#/shared/lib/db/dexie'

const TOPICS = [
  'Anatomy',
  'Pharmacology',
  'Biochemistry',
  'Pathology',
  'Physiology',
  'Microbiology',
] as const

function isoDate(
  offsetDays: number,
): string {
  const date =
    new Date()

  date.setDate(
    date.getDate() +
      offsetDays,
  )

  return date
    .toISOString()
    .slice(0, 10)
}

function uid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`
  )
}

const SAMPLE_CARDS: Array<{
  front: string
  back: string
  topic: string
}> = [
  {
    front:
      'What is the primary neurotransmitter at the neuromuscular junction?',
    back: 'Acetylcholine',
    topic: 'Physiology',
  },
  {
    front:
      'Which nerve innervates the thenar eminence?',
    back:
      'Median nerve (recurrent branch)',
    topic: 'Anatomy',
  },
  {
    front: 'MOA of ACE inhibitors',
    back:
      'Block conversion of angiotensin I → II; reduce vasoconstriction & aldosterone',
    topic: 'Pharmacology',
  },
  {
    front:
      'Rate-limiting enzyme of glycolysis',
    back:
      'Phosphofructokinase-1 (PFK-1)',
    topic: 'Biochemistry',
  },
  {
    front:
      'Reed-Sternberg cells are hallmark of…',
    back: 'Hodgkin lymphoma',
    topic: 'Pathology',
  },
  {
    front:
      'Gram-positive diplococci in pairs',
    back:
      'Streptococcus pneumoniae',
    topic: 'Microbiology',
  },
  {
    front:
      'Starling’s law of the heart',
    back:
      'Stroke volume ↑ with ↑ end-diastolic volume (within limits)',
    topic: 'Physiology',
  },
  {
    front:
      'Brachial plexus: roots',
    back: 'C5–T1',
    topic: 'Anatomy',
  },
  {
    front:
      'Warfarin antidote',
    back:
      'Vitamin K; 4F-PCC for severe bleeding',
    topic: 'Pharmacology',
  },
  {
    front:
      'HMP shunt main purpose',
    back:
      'NADPH production & ribose-5-phosphate',
    topic: 'Biochemistry',
  },
  {
    front:
      'Caseating granulomas → ?',
    back: 'Tuberculosis',
    topic: 'Pathology',
  },
  {
    front:
      'Catalase-positive, coagulase-positive cocci',
    back: 'Staphylococcus aureus',
    topic: 'Microbiology',
  },
  {
    front:
      'Frank-Starling: afterload effect',
    back:
      '↑ afterload → ↓ stroke volume',
    topic: 'Physiology',
  },
  {
    front:
      'Rotator cuff muscles (SITS)',
    back:
      'Supraspinatus, Infraspinatus, Teres minor, Subscapularis',
    topic: 'Anatomy',
  },
  {
    front:
      'Metformin MOA',
    back:
      '↓ hepatic gluconeogenesis; ↑ insulin sensitivity (AMPK)',
    topic: 'Pharmacology',
  },
  {
    front:
      'Essential fatty acids',
    back:
      'Linoleic (ω-6) & α-linolenic (ω-3)',
    topic: 'Biochemistry',
  },
]

function createCard(
  front: string,
  back: string,
  topic: string,
): Card {
  return {
    id: uid(),
    front,
    back,
    topic,
    createdAt:
      new Date().toISOString(),

    /*
     * New cards start genuinely new.
     *
     * We do not fabricate review history.
     * The scheduler will establish these values
     * through actual user interaction.
     */
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: isoDate(0),
  }
}

export async function seedIfEmpty(): Promise<void> {
  const count =
    await db.cards.count()

  if (count > 0) {
    return
  }

  /*
   * Seed learning CONTENT only.
   *
   * Deliberately do not seed:
   * - review sessions
   * - baseline features
   * - session signals
   * - personal insights
   * - calibration progress
   *
   * Those must come from actual user behavior.
   */
  const cards: Card[] =
    SAMPLE_CARDS.map(
      (sample) =>
        createCard(
          sample.front,
          sample.back,
          sample.topic,
        ),
    )

  /*
   * A small set of additional neutral practice cards
   * is acceptable for the demo, but they remain genuinely
   * new and contain no fabricated learning history.
   */
  const extraCards: Array<{
    front: string
    back: string
    topic: string
  }> = [
    {
      front:
        'What is the function of the Golgi apparatus?',
      back:
        'Modifies, sorts, and packages proteins and lipids.',
      topic:
        'Biochemistry',
    },
    {
      front:
        'What is the normal direction of depolarization in ventricular myocardium?',
      back:
        'From endocardium toward epicardium.',
      topic:
        'Physiology',
    },
    {
      front:
        'What is the main function of neutrophils?',
      back:
        'Rapid innate immune response, especially against bacterial infection.',
      topic:
        'Pathology',
    },
    {
      front:
        'What does an ACE inhibitor primarily reduce?',
      back:
        'Angiotensin II formation and aldosterone-mediated effects.',
      topic:
        'Pharmacology',
    },
    {
      front:
        'What stain is commonly used to identify acid-fast bacilli?',
      back:
        'Ziehl-Neelsen stain.',
      topic:
        'Microbiology',
    },
    {
      front:
        'What is the basic structural unit of the nervous system?',
      back:
        'The neuron.',
      topic:
        'Anatomy',
    },
  ]

  for (
    const sample of extraCards
  ) {
    cards.push(
      createCard(
        sample.front,
        sample.back,
        sample.topic,
      ),
    )
  }

  await db.cards.bulkAdd(
    cards,
  )

  /*
   * Keep adaptive learning opt-in.
   *
   * There is no evidence yet that the user wants
   * timing-based adaptation, and no evidence exists
   * from which to generate a personalized baseline.
   */
  await db.appSettings.put({
    key: 'hasSeenOnboarding',
    value: JSON.stringify(
      true,
    ),
  })

  await db.appSettings.put({
    key: 'adaptiveOptIn',
    value: JSON.stringify(
      false,
    ),
  })

  await db.appSettings.put({
    key: 'calibrationSessions',
    value: JSON.stringify(
      0,
    ),
  })
}
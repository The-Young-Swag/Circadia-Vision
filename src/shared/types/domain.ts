export type Card = {
    id: string
    front: string
    back: string
    topic: string
    targetDate?: string
    createdAt: string
    interval: number
    repetitions: number
    easeFactor: number
    dueDate: string
    lastReviewed?: string
  }
  
  export type ReviewSession = {
    id: string
    cardId: string
    sessionId: string
    timestamp: string
    grade: number
    durationMs?: number
  }
  
  export type BaselineFeature = {
    name: FeatureName
    mean: number
    variance: number
    stddev: number
    sampleCount: number
    lastUpdated: string
  }
  
  export type FeatureName =
    | 'interKeyLatency'
    | 'dwellTime'
    | 'correctionRate'
    | 'wpm'
  
  export type SessionSignal = {
    id: string
    sessionId: string
    minuteIndex: number
    timestamp: string
    interKeyLatency: number
    dwellTime: number
    correctionRate: number
    wpm: number
    zScores?: Record<FeatureName, number>
  }
  
  export type Insight = {
    id: string
    statement: string
    stat: string
    timestamp: string
    dismissed: boolean
    kind: 'retention' | 'focus' | 'peak' | 'general'
  }
  
  export type AppSettings = {
    key: string
    value: string
  }
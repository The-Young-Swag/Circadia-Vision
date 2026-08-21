/**
 * AI Gateway — mock, on-device, privacy-preserving per §7
 * All functions are user-initiated, optional, and return with verifiable reasoning.
 * No key content, no cloud by default. Disclosure is mandatory.
 */

export type AiInsight = {
  observation: string // "It looks like..."
  reasoning: string // "Because you often get X wrong after..."
  action: string
  confidence: 'low' | 'medium' | 'high'
}

export type AiExplanation = {
  hook: string // mnemonic
  alternative: string
  reasoning: string
}

// Mock: generate deeper insight from local data — observation not diagnosis
export async function generateDeeperInsight(cards: unknown, sessions: unknown): Promise<AiInsight | null> {
  // Simulate local processing delay
  await new Promise((r) => setTimeout(r, 400))
  void cards
  void sessions
  // Example pattern detection — in real, would analyze retention correlations
  return {
    observation: 'It looks like you’re making connections between Pharmacology and Physiology — your retention dips when you study them back-to-back.',
    reasoning: 'Because your sessions that mix those topics show a 12% lower recall on the second topic, while separated sessions don’t.',
    action: 'Try studying them on different days and see if it feels easier.',
    confidence: 'medium',
  }
}

export async function explainCard(front: string, _back: string): Promise<AiExplanation> {
  await new Promise((r) => setTimeout(r, 300))
  return {
    hook: `Think of "${front.slice(0, 20)}" as a story: break it into keywords and link each to an image.`,
    alternative: `Another way: "${front}" → try rephrasing as “What would happen if…?”`,
    reasoning: 'Generated locally from the card text only — no data leaves your device.',
  }
}

export async function translateAdaptiveDecision(technical: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 200))
  if (technical.includes('pause')) return 'You seem to be hesitating more than usual — your mind might be wandering. Want a lighter set?'
  if (technical.includes('correction')) return 'You’ve been correcting a bit more in the last minutes — familiar material might feel better right now.'
  return 'Your rhythm has drifted from your baseline — easier material could help for a bit.'
}

export async function askLearningAssistant(question: string, context: { cardsDue: number; retention: number }): Promise<{ answer: string; reasoning: string }> {
  await new Promise((r) => setTimeout(r, 500))
  const q = question.toLowerCase()
  if (q.includes('focus') || q.includes('what should')) {
    return {
      answer: `You have ${context.cardsDue} cards due. Your retention is at ${Math.round(context.retention * 100)}% — a short focused review will lock in recent learning.`,
      reasoning: `Based on ${context.cardsDue} due cards and your recent retention. No cloud used.`,
    }
  }
  if (q.includes('why') && q.includes('struggle')) {
    return {
      answer: 'It looks like Pharmacology is your quickest win — 61% there vs 78% elsewhere. Short, separate sessions help.',
      reasoning: 'Compared retention by topic from your local history.',
    }
  }
  return {
    answer: `I’m here to help you study, not decide for you. You asked: “${question}” — want to try a focused review or explore insights?`,
    reasoning: 'Generated locally, no data sent. Ask about focus, retention, or topics for more specific help.',
  }
}

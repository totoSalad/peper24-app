import type { Correction, GrammarErrorType } from './types'

const replies = [
  'That sounds lovely! What made that moment special for you?',
  'I can picture that. Tell me a little more about what happened next.',
  'Nice choice! If we were there together, what would you want to try first?',
]

export async function* streamMockReply(text: string) {
  const lower = text.toLowerCase()
  const answer =
    lower.includes('How do you say') || lower.includes('怎么说') || lower.includes('怎么表达')
      ? 'A natural way to say that is: "I was almost late today." I’ve saved it to your vocabulary.'
      : replies[Math.floor(Math.random() * replies.length)]

  const words = answer.split(' ')
  for (const word of words) {
    await new Promise((resolve) => window.setTimeout(resolve, 45))
    yield `${word} `
  }
}

const mockGrammarCounts = new Map<GrammarErrorType, number>()

// This only keeps the standalone UI demo interactive. The server is the
// authoritative source for grammar frequency once API integration is enabled.
export function detectMockGrammarCorrections(text: string): Correction[] {
  const detected: Correction[] = []
  if (/\bhe go\b/i.test(text)) {
    detected.push({
      errorType: 'subject_verb_agreement',
      original: 'He go…',
      corrected: 'He goes…',
      note: '第三人称单数 he 后面的动词通常要加 -s。',
    })
  }
  if (/\bi am agree\b/i.test(text)) {
    detected.push({
      errorType: 'subject_verb_agreement',
      original: 'I am agree.',
      corrected: 'I agree.',
      note: 'agree 本身是动词，前面不需要 am。',
    })
  }
  const dueTypes = new Set<GrammarErrorType>()
  for (const errorType of new Set(detected.map((error) => error.errorType))) {
    const count = (mockGrammarCounts.get(errorType) ?? 0) + 1
    mockGrammarCounts.set(errorType, count)
    if (count === 2) dueTypes.add(errorType)
  }
  return detected.filter((error) => dueTypes.has(error.errorType))
}

export async function mockTranscription() {
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  return "I'd like to practice ordering coffee, please."
}

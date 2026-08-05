import type { Correction } from './types'

const replies = [
  'That sounds lovely! What made that moment special for you?',
  'I can picture that. Tell me a little more about what happened next.',
  'Nice choice! If we were there together, what would you want to try first?',
]

export async function* streamMockReply(text: string) {
  const lower = text.toLowerCase()
  const answer =
    lower.includes('怎么说') || lower.includes('怎么表达')
      ? 'A natural way to say that is: “I was almost late today.” I’ve saved it to your vocabulary.'
      : replies[Math.floor(Math.random() * replies.length)]

  const words = answer.split(' ')
  for (const word of words) {
    await new Promise((resolve) => window.setTimeout(resolve, 45))
    yield `${word} `
  }
}

export function detectGrammarPattern(text: string): { key: string; correction: Correction } | null {
  if (/\bhe go\b/i.test(text)) {
    return {
      key: 'third-person-singular-s',
      correction: {
        original: 'He go…',
        corrected: 'He goes…',
        note: '第三人称单数 he 后面的动词通常要加 -s。',
      },
    }
  }
  if (/\bi am agree\b/i.test(text)) {
    return {
      key: 'agree-without-be',
      correction: {
        original: 'I am agree.',
        corrected: 'I agree.',
        note: 'agree 本身是动词，前面不需要 am。',
      },
    }
  }
  return null
}

export async function mockTranscription() {
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  return "I'd like to practice ordering coffee, please."
}

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Profile {
  name: string
  age?: number
  occupation?: string
  englishLevel: EnglishLevel
}

export interface AccountProfile {
  displayName: string
  age?: number
  occupation?: string
  englishLevel: EnglishLevel
}

export interface Account {
  id: string
  email: string
  status: 'active' | 'disabled'
  profile: AccountProfile
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  topic: string
  scene: string
  updatedAt: string
}

export interface Correction {
  errorType: GrammarErrorType
  original: string
  corrected: string
  note: string
}

export type GrammarErrorType =
  | 'subject_verb_agreement'
  | 'tense'
  | 'article'
  | 'singular_plural'
  | 'countable_uncountable'
  | 'preposition_collocation'
  | 'adjective_adverb'
  | 'comparative'
  | 'pronoun'
  | 'infinitive_gerund'
  | 'modal_verb_form'
  | 'double_negative'
  | 'sentence_fragment'
  | 'chinese_word_order'
  | 'there_be_have'
  | 'duplicate_conjunction'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  translation?: string
  corrections?: Correction[]
  createdAt: string
}

export interface Vocabulary {
  id: string
  expression: string
  normalizedExpression: string
  phonetic: string
  partOfSpeech: string
  meaning: string
  example: string
  lastEncounteredAt: string
  reviewState: ReviewState
}

export interface ReviewState {
  vocabularyId: string
  repetitions: number
  intervalDays: number
  easinessFactor: number
  nextReviewAt: string
  updatedAt: string
}

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewOutcome extends ReviewState {
  result: ReviewResult
  score: number
  reviewedAt: string
}

export interface Memory {
  id: string
  type: 'profile' | 'preference' | 'significant_fact' | 'short_term'
  content: string
  confidence: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

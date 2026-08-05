export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Profile {
  name: string
  age: number
  occupation: string
  englishLevel: EnglishLevel
}

export interface Conversation {
  id: string
  topic: string
  scene: string
  updatedAt: string
}

export interface Correction {
  original: string
  corrected: string
  note: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  translation?: string
  correction?: Correction
  createdAt: string
}

export interface Vocabulary {
  id: string
  expression: string
  phonetic: string
  meaning: string
  example: string
  nextReviewAt: string
  reviewed: boolean
}

export interface Memory {
  id: string
  type: '个人信息' | '爱好' | '重要事实' | '短期事实'
  content: string
  expiresAt?: string
}

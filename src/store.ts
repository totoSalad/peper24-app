import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, EnglishLevel, Memory, Message, Profile, Vocabulary } from './types'

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()

const starterVocabulary: Vocabulary[] = [
  {
    id: id(),
    expression: 'whole wheat bread',
    phonetic: '/hoʊl wiːt bred/',
    meaning: '全麦面包',
    example: 'Would you like your sandwich on whole wheat bread?',
    nextReviewAt: now(),
    reviewed: false,
  },
  {
    id: id(),
    expression: 'cappuccino',
    phonetic: '/ˌkæpəˈtʃiːnoʊ/',
    meaning: '卡布奇诺',
    example: "I'd like a cappuccino, please.",
    nextReviewAt: now(),
    reviewed: false,
  },
  {
    id: id(),
    expression: 'almost late',
    phonetic: '/ˈɔːlmoʊst leɪt/',
    meaning: '差点迟到',
    example: 'I was almost late today.',
    nextReviewAt: now(),
    reviewed: false,
  },
]

const starterMemories: Memory[] = [
  { id: id(), type: '个人信息', content: 'Li Hua，28 岁，软件工程师' },
  { id: id(), type: '爱好', content: '喜欢咖啡和周末徒步' },
  { id: id(), type: '短期事实', content: '最近在准备一次海外旅行', expiresAt: '7 天后' },
]

interface AppState {
  email: string
  pendingEmail: string
  authenticated: boolean
  verified: boolean
  profileComplete: boolean
  profile: Profile
  conversations: Conversation[]
  messages: Record<string, Message[]>
  vocabulary: Vocabulary[]
  memories: Memory[]
  grammarPatterns: Record<string, { count: number; corrected: boolean }>
  register: (email: string) => void
  verify: (code: string) => boolean
  login: (email: string) => void
  completeProfile: (profile: Profile) => void
  updateLevel: (level: EnglishLevel) => void
  logout: () => void
  createConversation: (topic: string, scene: string) => string
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void
  addVocabulary: (expression: string, meaning?: string, example?: string) => void
  removeVocabulary: (vocabularyId: string) => void
  completeReview: (vocabularyId: string) => void
  recordGrammarPattern: (key: string) => { shouldCorrect: boolean }
  removeMemory: (memoryId: string) => void
  resetDemo: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      email: '',
      pendingEmail: '',
      authenticated: false,
      verified: false,
      profileComplete: false,
      profile: { name: 'Li Hua', age: 28, occupation: '软件工程师', englishLevel: 'B1' },
      conversations: [],
      messages: {},
      vocabulary: starterVocabulary,
      memories: starterMemories,
      grammarPatterns: {},
      register: (email) => set({ pendingEmail: email }),
      verify: (code) => {
        if (code !== '123456') return false
        set((state) => ({ email: state.pendingEmail, verified: true, authenticated: true }))
        return true
      },
      login: (email) => set({ email, verified: true, authenticated: true, profileComplete: true }),
      completeProfile: (profile) => set({ profile, profileComplete: true }),
      updateLevel: (englishLevel) =>
        set((state) => ({ profile: { ...state.profile, englishLevel } })),
      logout: () => set({ authenticated: false }),
      createConversation: (topic, scene) => {
        const conversationId = id()
        const conversation = { id: conversationId, topic, scene, updatedAt: now() }
        const welcome: Message = {
          id: id(),
          role: 'assistant',
          content:
            scene === '餐厅点餐'
              ? 'Hi! Welcome to the restaurant. What would you like to order today?'
              : `Let’s talk about ${topic}. What comes to your mind first?`,
          translation:
            scene === '餐厅点餐'
              ? '嗨！欢迎来到餐厅。今天想点些什么？'
              : `我们来聊聊${topic}。你首先想到了什么？`,
          createdAt: now(),
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          messages: { ...state.messages, [conversationId]: [welcome] },
        }))
        return conversationId
      },
      addMessage: (conversationId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] ?? []), message],
          },
        })),
      updateMessage: (conversationId, messageId, patch) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] ?? []).map((message) =>
              message.id === messageId ? { ...message, ...patch } : message,
            ),
          },
        })),
      addVocabulary: (expression, meaning = '待补充释义', example = '') => {
        const normalized = expression.trim().toLowerCase()
        if (
          !normalized ||
          get().vocabulary.some((item) => item.expression.toLowerCase() === normalized)
        )
          return
        set((state) => ({
          vocabulary: [
            {
              id: id(),
              expression: expression.trim(),
              phonetic: '/…/',
              meaning,
              example,
              nextReviewAt: now(),
              reviewed: false,
            },
            ...state.vocabulary,
          ],
        }))
      },
      removeVocabulary: (vocabularyId) =>
        set((state) => ({
          vocabulary: state.vocabulary.filter((item) => item.id !== vocabularyId),
        })),
      completeReview: (vocabularyId) =>
        set((state) => ({
          vocabulary: state.vocabulary.map((item) =>
            item.id === vocabularyId ? { ...item, reviewed: true } : item,
          ),
        })),
      recordGrammarPattern: (key) => {
        const current = get().grammarPatterns[key] ?? { count: 0, corrected: false }
        const next = { count: current.count + 1, corrected: current.corrected }
        const shouldCorrect = next.count === 2 && !next.corrected
        if (shouldCorrect) next.corrected = true
        set((state) => ({ grammarPatterns: { ...state.grammarPatterns, [key]: next } }))
        return { shouldCorrect }
      },
      removeMemory: (memoryId) =>
        set((state) => ({ memories: state.memories.filter((item) => item.id !== memoryId) })),
      resetDemo: () =>
        set({
          conversations: [],
          messages: {},
          vocabulary: starterVocabulary,
          grammarPatterns: {},
          memories: starterMemories,
        }),
    }),
    { name: 'peper24-demo-v1' },
  ),
)

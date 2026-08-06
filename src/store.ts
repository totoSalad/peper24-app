import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useServerApi } from './api'
import type { Account, Conversation, Message, Profile } from './types'

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()

interface AppState {
  email: string
  account?: Account
  authChecked: boolean
  authenticated: boolean
  onboardingRequired: boolean
  profile: Profile
  conversations: Conversation[]
  messages: Record<string, Message[]>
  setAuthenticated: (account: Account, onboardingRequired?: boolean) => void
  setProfile: (account: Account) => void
  clearAuthentication: () => void
  markAuthChecked: () => void
  createConversation: (topic: string, scene: string) => string
  hydrateConversation: (conversation: Conversation, welcomeMessage: Message) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void
  resetDemo: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      email: '',
      account: undefined,
      authChecked: !useServerApi,
      authenticated: false,
      onboardingRequired: false,
      profile: { name: 'Li Hua', age: 28, occupation: '软件工程师', englishLevel: 'B1' },
      conversations: [],
      messages: {},
      setAuthenticated: (account, onboardingRequired = false) =>
        set({
          account,
          email: account.email,
          authenticated: true,
          authChecked: true,
          onboardingRequired,
          profile: {
            name: account.profile.displayName,
            age: account.profile.age,
            occupation: account.profile.occupation,
            englishLevel: account.profile.englishLevel,
          },
        }),
      setProfile: (account) =>
        set({
          account,
          onboardingRequired: false,
          profile: {
            name: account.profile.displayName,
            age: account.profile.age,
            occupation: account.profile.occupation,
            englishLevel: account.profile.englishLevel,
          },
        }),
      clearAuthentication: () =>
        set({
          account: undefined,
          authenticated: false,
          authChecked: true,
          onboardingRequired: false,
        }),
      markAuthChecked: () => set({ authChecked: true }),
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
      hydrateConversation: (conversation, welcomeMessage) =>
        set((state) => ({
          conversations: [
            conversation,
            ...state.conversations.filter((item) => item.id !== conversation.id),
          ],
          messages: { ...state.messages, [conversation.id]: [welcomeMessage] },
        })),
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
      resetDemo: () =>
        set({
          conversations: [],
          messages: {},
        }),
    }),
    {
      name: 'peper24-demo-v1',
      partialize: (state) => ({
        ...(useServerApi
          ? { onboardingRequired: state.onboardingRequired }
          : {
              account: state.account,
              authenticated: state.authenticated,
              profile: state.profile,
              email: state.email,
              onboardingRequired: state.onboardingRequired,
            }),
        conversations: state.conversations,
        messages: state.messages,
      }),
    },
  ),
)

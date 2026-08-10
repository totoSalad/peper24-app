import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Account, Conversation, Message, Profile } from './types'

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
  hydrateConversation: (conversation: Conversation, welcomeMessage: Message) => void
  setConversations: (conversations: Conversation[]) => void
  upsertConversation: (conversation: Conversation) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      email: '',
      account: undefined,
      authChecked: false,
      authenticated: false,
      onboardingRequired: false,
      profile: { name: '', englishLevel: 'B1' },
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
          conversations: [],
          messages: {},
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
          // 登出/登录态失效时一并清掉用户数据,防止下一个登录账号看到。
          conversations: [],
          messages: {},
        }),
      hydrateConversation: (conversation, welcomeMessage) =>
        set((state) => ({
          conversations: [
            conversation,
            ...state.conversations.filter((item) => item.id !== conversation.id),
          ],
          messages: { ...state.messages, [conversation.id]: [welcomeMessage] },
        })),
      setConversations: (conversations) =>
        set({
          conversations,
          // 换了一批会话,旧的本地消息缓存随之失效。
          messages: {},
        }),
      upsertConversation: (conversation) =>
        set((state) => ({
          conversations: [
            conversation,
            ...state.conversations.filter((item) => item.id !== conversation.id),
          ],
        })),
      setMessages: (conversationId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [conversationId]: messages },
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
    }),
    {
      name: 'peper24-app-v1',
      version: 3,
      // 只保留注册后的资料完善状态；账号、会话和消息全部以服务端为准。
      migrate: (persisted) => {
        const state = persisted as { onboardingRequired?: boolean } | undefined
        return { onboardingRequired: state?.onboardingRequired ?? false }
      },
      partialize: (state) => ({ onboardingRequired: state.onboardingRequired }),
    },
  ),
)

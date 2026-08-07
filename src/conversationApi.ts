import { useQuery } from '@tanstack/react-query'
import type { Correction } from './types'
import { apiRequest, useServerApi } from './api'
import type { Conversation, Message, Scene } from './types'

export type ConversationStreamEvent =
  | { type: 'message.start'; messageId: string }
  | { type: 'message.delta'; messageId: string; delta: string }
  | { type: 'tool.call'; toolCallId: string; name: string; input: unknown }
  | { type: 'tool.result'; toolCallId: string; output: unknown }
  | { type: 'correction.ready'; messageId: string; correction: Correction }
  | { type: 'message.done'; messageId: string }
  | { type: 'error'; code: string; retryable: boolean }

export const useServerConversation = useServerApi

export async function createServerConversation(topic: string) {
  return apiRequest<{ conversation: Conversation; welcomeMessage: Message }>(
    '/api/v1/conversations',
    { method: 'POST', body: JSON.stringify({ topic }) },
  )
}

// 演示环境（未连服务器）下的话题列表，仅用于保持 UI 可交互。
const demoScenes: Scene[] = [
  {
    topic: 'restaurant',
    scene:
      "you're at a new restaurant with a friend and you want to figure out what to order and how to ask for recommendations.",
    icon: '🍽️',
  },
  {
    topic: 'airport',
    scene:
      "you're at the airport about to take your first solo trip abroad, and you're a little nervous about how everything works.",
    icon: '✈️',
  },
  {
    topic: 'weekend trip',
    scene:
      'you and a friend are planning a weekend trip together and want to decide where to go and what to do.',
    icon: '🚗',
  },
]

/** 从服务器拉取可选话题 + 场景（第④层数据源）。 */
export function useScenes() {
  return useQuery({
    queryKey: ['scenes'],
    queryFn: async () =>
      useServerApi ? (await apiRequest<{ scenes: Scene[] }>('/api/v1/scenes')).scenes : demoScenes,
  })
}

export async function* streamConversationMessage(
  conversationId: string,
  input: { content: string; clientRequestId: string; voiceRecordingId?: string },
): AsyncIterable<ConversationStreamEvent> {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  const response = await fetch(
    `${apiBaseUrl}/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/stream`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { accept: 'text/event-stream', 'content-type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  if (!response.ok || !response.body) throw new Error(`CHAT_STREAM_HTTP_${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
      if (data) yield JSON.parse(data) as ConversationStreamEvent
    }
    if (done) break
  }
}

export function translateConversationMessage(messageId: string) {
  return apiRequest<{ translation: string }>(
    `/api/v1/messages/${encodeURIComponent(messageId)}/translation`,
    { method: 'POST' },
  )
}

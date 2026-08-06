import type { Correction } from './types'
import { apiRequest, useServerApi } from './api'
import type { Conversation, Message } from './types'

export type ConversationStreamEvent =
  | { type: 'message.start'; messageId: string }
  | { type: 'message.delta'; messageId: string; delta: string }
  | { type: 'tool.call'; toolCallId: string; name: string; input: unknown }
  | { type: 'tool.result'; toolCallId: string; output: unknown }
  | { type: 'correction.ready'; messageId: string; correction: Correction }
  | { type: 'message.done'; messageId: string }
  | { type: 'error'; code: string; retryable: boolean }

export const useServerConversation = useServerApi

export async function createServerConversation(topic: string, scene: string) {
  return apiRequest<{ conversation: Conversation; welcomeMessage: Message }>(
    '/api/v1/conversations',
    { method: 'POST', body: JSON.stringify({ topic, scene }) },
  )
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

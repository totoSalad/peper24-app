import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, useServerApi } from './api'
import type { Memory } from './types'

export const memoryKeys = { all: ['memories'] as const }

const now = new Date().toISOString()
let demoMemories: Memory[] = [
  {
    id: 'demo-profile',
    type: 'profile',
    content: 'Li Hua，28 岁，软件工程师',
    confidence: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-preference',
    type: 'preference',
    content: '喜欢咖啡和周末徒步',
    confidence: 0.9,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-short-term',
    type: 'short_term',
    content: '最近在准备一次海外旅行',
    confidence: 0.9,
    expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    createdAt: now,
    updatedAt: now,
  },
]

export function useMemories() {
  return useQuery({
    queryKey: memoryKeys.all,
    queryFn: async () =>
      useServerApi
        ? (await apiRequest<{ memories: Memory[] }>('/api/v1/memories')).memories
        : [...demoMemories],
  })
}

export function useCorrectMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (useServerApi) {
        return (
          await apiRequest<{ memory: Memory }>(`/api/v1/memories/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
          })
        ).memory
      }
      const item = demoMemories.find((memory) => memory.id === id)
      if (!item) throw new Error('MEMORY_NOT_FOUND')
      item.content = content.trim()
      item.updatedAt = new Date().toISOString()
      return { ...item }
    },
    onSuccess: (memory) => {
      queryClient.setQueryData<Memory[]>(memoryKeys.all, (current = []) =>
        current.map((item) => (item.id === memory.id ? memory : item)),
      )
    },
  })
}

export function useRemoveMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (useServerApi) {
        await apiRequest<void>(`/api/v1/memories/${encodeURIComponent(id)}`, { method: 'DELETE' })
      } else {
        demoMemories = demoMemories.filter((item) => item.id !== id)
      }
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Memory[]>(memoryKeys.all, (current = []) =>
        current.filter((item) => item.id !== id),
      )
    },
  })
}

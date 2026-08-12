import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from './api'
import type { Memory } from './types'

export const memoryKeys = { all: ['memories'] as const }

export function triggerMemoryExtraction() {
  return apiRequest<{ changedCount: number }>('/api/v1/memories/extractions', { method: 'POST' })
}

export function useMemories() {
  return useQuery({
    queryKey: memoryKeys.all,
    queryFn: async () => (await apiRequest<{ memories: Memory[] }>('/api/v1/memories')).memories,
  })
}

export function useCorrectMemory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return (
        await apiRequest<{ memory: Memory }>(`/api/v1/memories/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ content }),
        })
      ).memory
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
      await apiRequest<void>(`/api/v1/memories/${encodeURIComponent(id)}`, { method: 'DELETE' })
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Memory[]>(memoryKeys.all, (current = []) =>
        current.filter((item) => item.id !== id),
      )
    },
  })
}

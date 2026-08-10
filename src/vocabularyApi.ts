import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from './api'
import type { ReviewOutcome, ReviewResult, ReviewState, Vocabulary } from './types'

export const vocabularyKeys = {
  all: ['vocabularies'] as const,
  due: ['reviews', 'today'] as const,
}

// 服务端把释义存成嵌套 detail(cnMeaning/enMeaning/example/phonetic),
// 而前端 Vocabulary 用扁平字段,这里做一次映射。
interface ServerVocabulary {
  id: string
  expression: string
  normalizedExpression: string
  detail: {
    cnMeaning: string
    enMeaning: string
    example: string
    phonetic: string
  }
  lastEncounteredAt: string
  reviewState: ReviewState
}

function toVocabulary(item: ServerVocabulary): Vocabulary {
  return {
    id: item.id,
    expression: item.expression,
    normalizedExpression: item.normalizedExpression,
    phonetic: item.detail.phonetic,
    // 服务端 detail 暂不含词性,保留空串以匹配前端类型。
    partOfSpeech: '',
    meaning: item.detail.cnMeaning,
    example: item.detail.example,
    lastEncounteredAt: item.lastEncounteredAt,
    reviewState: item.reviewState,
  }
}

export function useVocabularies() {
  return useQuery({
    queryKey: vocabularyKeys.all,
    queryFn: async () =>
      (
        await apiRequest<{ vocabularies: ServerVocabulary[] }>('/api/v1/vocabularies')
      ).vocabularies.map(toVocabulary),
  })
}

export function useDueReviews() {
  return useQuery({
    queryKey: vocabularyKeys.due,
    queryFn: async () =>
      (
        await apiRequest<{ reviews: ServerVocabulary[] }>('/api/v1/reviews/today?limit=10')
      ).reviews.map(toVocabulary),
  })
}

export function useAddVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { expression: string; sourceMessageId: string }) =>
      apiRequest<{ vocabulary: ServerVocabulary }>('/api/v1/vocabularies', {
        method: 'POST',
        body: JSON.stringify(input),
      }).then(({ vocabulary }) => ({ vocabulary: toVocabulary(vocabulary) })),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.due }),
      ])
    },
  })
}

export function useRemoveVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/v1/vocabularies/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.due }),
      ])
    },
  })
}

export function useAnswerReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      vocabularyId,
      result,
      clientRequestId,
    }: {
      vocabularyId: string
      result: ReviewResult
      clientRequestId: string
    }) =>
      apiRequest<{ review: ReviewOutcome }>(
        `/api/v1/reviews/${encodeURIComponent(vocabularyId)}/answer`,
        { method: 'POST', body: JSON.stringify({ result, clientRequestId }) },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.due }),
      ])
    },
  })
}

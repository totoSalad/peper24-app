import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, useServerApi } from './api'
import type { ReviewOutcome, ReviewResult, Vocabulary } from './types'

export const vocabularyKeys = {
  all: ['vocabularies'] as const,
  due: ['reviews', 'today'] as const,
}

const demoNow = new Date().toISOString()
let demoVocabularies: Vocabulary[] = [
  {
    id: 'demo-whole-wheat-bread',
    expression: 'whole wheat bread',
    normalizedExpression: 'whole wheat bread',
    phonetic: '/hoʊl wiːt bred/',
    partOfSpeech: 'noun phrase',
    meaning: '全麦面包',
    example: 'Would you like your sandwich on whole wheat bread?',
    lastEncounteredAt: demoNow,
    reviewState: {
      vocabularyId: 'demo-whole-wheat-bread',
      repetitions: 0,
      intervalDays: 0,
      easinessFactor: 2.5,
      nextReviewAt: demoNow,
      updatedAt: demoNow,
    },
  },
  {
    id: 'demo-almost-late',
    expression: 'almost late',
    normalizedExpression: 'almost late',
    phonetic: '/ˈɔːlmoʊst leɪt/',
    partOfSpeech: 'adjective phrase',
    meaning: '差点迟到',
    example: 'I was almost late today.',
    lastEncounteredAt: demoNow,
    reviewState: {
      vocabularyId: 'demo-almost-late',
      repetitions: 0,
      intervalDays: 0,
      easinessFactor: 2.5,
      nextReviewAt: demoNow,
      updatedAt: demoNow,
    },
  },
]

const demoApi = {
  list: async () => [...demoVocabularies],
  due: async () =>
    demoVocabularies
      .filter((item) => new Date(item.reviewState.nextReviewAt) <= new Date())
      .slice(0, 10),
  add: async (expression: string) => {
    const normalized = expression.trim().toLocaleLowerCase()
    const existing = demoVocabularies.find((item) => item.normalizedExpression === normalized)
    if (existing) return existing
    const created: Vocabulary = {
      id: crypto.randomUUID(),
      expression: expression.trim(),
      normalizedExpression: normalized,
      phonetic: '/demo/',
      partOfSpeech: 'expression',
      meaning: '开发环境释义',
      example: `I learned “${expression.trim()}” today.`,
      lastEncounteredAt: new Date().toISOString(),
      reviewState: {
        vocabularyId: '',
        repetitions: 0,
        intervalDays: 0,
        easinessFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    created.reviewState.vocabularyId = created.id
    demoVocabularies = [created, ...demoVocabularies]
    return created
  },
  remove: async (id: string) => {
    demoVocabularies = demoVocabularies.filter((item) => item.id !== id)
  },
  answer: async (vocabularyId: string, result: ReviewResult): Promise<ReviewOutcome> => {
    const item = demoVocabularies.find((value) => value.id === vocabularyId)
    if (!item) throw new Error('VOCABULARY_NOT_FOUND')
    const score = { again: 0, hard: 2, good: 3, easy: 5 }[result]
    const reviewedAt = new Date()
    const nextReviewAt = new Date(reviewedAt.getTime() + 86_400_000).toISOString()
    if (result !== 'again') item.reviewState.nextReviewAt = nextReviewAt
    return { ...item.reviewState, result, score, reviewedAt: reviewedAt.toISOString() }
  },
}

export function useVocabularies() {
  return useQuery({
    queryKey: vocabularyKeys.all,
    queryFn: async () =>
      useServerApi
        ? (await apiRequest<{ vocabularies: Vocabulary[] }>('/api/v1/vocabularies')).vocabularies
        : demoApi.list(),
  })
}

export function useDueReviews() {
  return useQuery({
    queryKey: vocabularyKeys.due,
    queryFn: async () =>
      useServerApi
        ? (await apiRequest<{ reviews: Vocabulary[] }>('/api/v1/reviews/today?limit=10')).reviews
        : demoApi.due(),
  })
}

export function useAddVocabulary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { expression: string; sourceMessageId: string }) =>
      useServerApi
        ? apiRequest<{ vocabulary: Vocabulary }>('/api/v1/vocabularies', {
            method: 'POST',
            body: JSON.stringify(input),
          })
        : demoApi.add(input.expression).then((vocabulary) => ({ vocabulary })),
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
      useServerApi
        ? apiRequest<void>(`/api/v1/vocabularies/${encodeURIComponent(id)}`, { method: 'DELETE' })
        : demoApi.remove(id),
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
    mutationFn: (input: { vocabularyId: string; result: ReviewResult; clientRequestId: string }) =>
      useServerApi
        ? apiRequest<{ review: ReviewOutcome }>(
            `/api/v1/reviews/${encodeURIComponent(input.vocabularyId)}/answer`,
            { method: 'POST', body: JSON.stringify(input) },
          )
        : demoApi.answer(input.vocabularyId, input.result).then((review) => ({ review })),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.all }),
        queryClient.invalidateQueries({ queryKey: vocabularyKeys.due }),
      ])
    },
  })
}

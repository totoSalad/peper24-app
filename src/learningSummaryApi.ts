import { useQuery } from '@tanstack/react-query'
import { apiRequest } from './api'
import type { DailyLearningSummary } from './types'

export const learningSummaryKeys = {
  today: ['learning-summaries', 'today'] as const,
  history: ['learning-summaries', 'history'] as const,
  detail: (date: string) => ['learning-summaries', 'detail', date] as const,
}

export function useTodayLearningSummary(enabled = true) {
  return useQuery({
    queryKey: learningSummaryKeys.today,
    queryFn: async () =>
      (
        await apiRequest<{ summary: DailyLearningSummary | null }>(
          '/api/v1/learning-summaries/today',
        )
      ).summary,
    enabled,
  })
}

export function useLearningSummaryHistory() {
  return useQuery({
    queryKey: learningSummaryKeys.history,
    queryFn: async () =>
      (
        await apiRequest<{ summaries: DailyLearningSummary[] }>(
          '/api/v1/learning-summaries?limit=50',
        )
      ).summaries,
  })
}

export function useLearningSummary(date: string) {
  return useQuery({
    queryKey: learningSummaryKeys.detail(date),
    queryFn: async () =>
      (
        await apiRequest<{ summary: DailyLearningSummary }>(
          `/api/v1/learning-summaries/${encodeURIComponent(date)}`,
        )
      ).summary,
    enabled: Boolean(date),
  })
}

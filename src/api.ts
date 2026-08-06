const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
export const useServerApi = import.meta.env.VITE_USE_SERVER_API === 'true'

let unauthorizedHandler: (() => void) | undefined

export function setUnauthorizedHandler(handler?: () => void) {
  unauthorizedHandler = handler
}

interface ApiEnvelope<T> {
  data: T
  requestId: string
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const payload = (await response.json()) as ApiEnvelope<T> & {
    error?: { code?: string; message?: string }
  }
  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.()
    throw new ApiError(
      payload.error?.code ?? 'REQUEST_FAILED',
      payload.error?.message ?? '请求失败，请稍后重试',
      response.status,
    )
  }
  return payload.data
}

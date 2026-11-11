import { apiRequest } from './api'

type Transcription =
  | { status: 'processing'; retryAfterMs?: number }
  | { status: 'completed'; recordingId: string; transcript: string; durationMs: number }
  | { status: 'failed'; errorCode?: string }

export async function uploadAndTranscribeVoice(blob: Blob, durationMs: number) {
  const contentType = blob.type
  const extension = contentType === 'audio/mp4' ? 'mp4' : 'webm'
  const signed = await apiRequest<{
    recordingId: string
    uploadUrl: string
    headers: Record<string, string>
  }>('/api/v1/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({
      purpose: 'voice_recording',
      contentType,
      sizeBytes: blob.size,
      extension,
    }),
  })
  const upload = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: signed.headers,
    body: blob,
  })
  if (!upload.ok) throw new Error('录音上传失败，请检查 OSS 跨域配置后重试。')

  let result = await apiRequest<Transcription>('/api/v1/speech/transcriptions', {
    method: 'POST',
    body: JSON.stringify({ recordingId: signed.recordingId, durationMs }),
  })
  while (result.status === 'processing') {
    const retryAfterMs = result.retryAfterMs ?? 1000
    await new Promise((resolve) => setTimeout(resolve, Math.max(500, retryAfterMs)))
    result = await apiRequest<Transcription>(
      `/api/v1/speech/transcriptions/${encodeURIComponent(signed.recordingId)}`,
    )
  }
  if (result.status === 'failed') throw new Error('语音识别失败，请重试。')
  if (!result.transcript.trim()) throw new Error('没有识别到英文语音，请重试。')
  return result
}

export function getVoiceRecordingUrl(messageId: string) {
  return apiRequest<{ url: string; expiresAt: string }>(
    `/api/v1/messages/${encodeURIComponent(messageId)}/voice-recording`,
  )
}

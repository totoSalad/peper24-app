import { apiRequest } from './api'

export type SupportedRecordingMime = 'audio/webm;codecs=opus' | 'audio/webm' | 'audio/mp4'

interface SignedUpload {
  recordingId: string
  objectKey: string
  uploadUrl: string
  headers: Record<string, string>
  uploadExpiresAt: string
}

export type TranscriptionResponse =
  | { status: 'processing'; retryAfterMs: number }
  | { status: 'completed'; recordingId: string; transcript: string; durationMs?: number }
  | { status: 'failed'; errorCode: string }

export type MessageSpeechResponse =
  | { status: 'processing'; retryAfterMs: number }
  | {
      status: 'ready'
      audio: {
        parts: Array<{ url: string; durationMs?: number }>
        totalDurationMs?: number
      }
      expiresAt: string
    }

export function chooseRecordingMime(): SupportedRecordingMime {
  const candidates: SupportedRecordingMime[] = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'audio/mp4'
}

export async function uploadVoiceRecording(
  blob: Blob,
  contentType: SupportedRecordingMime,
): Promise<SignedUpload> {
  if (blob.size > 10 * 1024 * 1024) throw new Error('AUDIO_TOO_LARGE')
  const extension = contentType === 'audio/mp4' ? 'mp4' : 'webm'
  const signed = await apiRequest<SignedUpload>('/api/v1/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({
      purpose: 'voice_recording',
      contentType,
      sizeBytes: blob.size,
      extension,
    }),
  })
  const response = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: signed.headers,
    body: blob,
  })
  if (!response.ok) throw new Error(`VOICE_UPLOAD_HTTP_${response.status}`)
  return signed
}

export function startTranscription(recordingId: string, durationMs: number) {
  return apiRequest<TranscriptionResponse>('/api/v1/speech/transcriptions', {
    method: 'POST',
    body: JSON.stringify({ recordingId, durationMs }),
  })
}

export function getTranscription(recordingId: string) {
  return apiRequest<TranscriptionResponse>(
    `/api/v1/speech/transcriptions/${encodeURIComponent(recordingId)}`,
  )
}

export function requestMessageSpeech(messageId: string) {
  return apiRequest<MessageSpeechResponse>(
    `/api/v1/messages/${encodeURIComponent(messageId)}/speech`,
    { method: 'POST' },
  )
}

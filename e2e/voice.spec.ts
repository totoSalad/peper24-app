import { expect, test } from '@playwright/test'

test('long press records, sends a voice message, and renders the transcript for playback', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const track = { stop() {} }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [track] }) },
    })
    class Recorder {
      static isTypeSupported(type: string) {
        return type === 'audio/webm;codecs=opus'
      }
      state = 'inactive'
      mimeType = 'audio/webm;codecs=opus'
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {
        this.state = 'recording'
      }
      stop() {
        this.state = 'inactive'
        this.ondataavailable?.({ data: new Blob(['voice'], { type: this.mimeType }) })
        this.onstop?.()
      }
    }
    Object.defineProperty(globalThis, 'MediaRecorder', { configurable: true, value: Recorder })
  })

  const envelope = (data: unknown) => ({ data, requestId: 'test' })
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      json: envelope({
        user: {
          id: 'voice-user',
          email: 'voice@example.com',
          status: 'active',
          profile: { displayName: 'Voice Tester', englishLevel: 'B1' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    }),
  )
  await page.route('**/api/v1/conversations', (route) =>
    route.fulfill({
      json: envelope({
        conversations: [
          { id: 'voice-chat', topic: 'Practice', scene: '', updatedAt: new Date().toISOString() },
        ],
      }),
    }),
  )
  let sent = false
  await page.route('**/api/v1/conversations/voice-chat/messages', (route) =>
    route.fulfill({
      json: envelope({
        messages: sent
          ? [
              {
                id: 'server-message',
                role: 'user',
                content: 'Hello there.',
                createdAt: new Date().toISOString(),
                voiceRecording: {
                  id: 'recording-1',
                  status: 'available',
                  expiresAt: new Date(Date.now() + 86400_000).toISOString(),
                },
              },
            ]
          : [],
      }),
    }),
  )
  await page.route('**/api/v1/uploads/sign', (route) =>
    route.fulfill({
      json: envelope({
        recordingId: 'recording-1',
        uploadUrl: '/mock-upload',
        headers: { 'Content-Type': 'audio/webm;codecs=opus' },
      }),
    }),
  )
  await page.route('**/mock-upload', (route) => route.fulfill({ status: 200, body: '' }))
  await page.route('**/api/v1/speech/transcriptions', (route) =>
    route.fulfill({
      json: envelope({
        status: 'completed',
        recordingId: 'recording-1',
        transcript: 'Hello there.',
        durationMs: 700,
      }),
    }),
  )
  let streamBody: { voiceRecordingId?: string; content?: string } | undefined
  await page.route('**/api/v1/conversations/voice-chat/messages/stream', async (route) => {
    streamBody = route.request().postDataJSON()
    sent = true
    await route.fulfill({
      contentType: 'text/event-stream',
      body:
        'data: {"type":"message.start","messageId":"assistant-1"}\n\n' +
        'data: {"type":"message.delta","messageId":"assistant-1","delta":"Hi!"}\n\n' +
        'data: {"type":"message.done","messageId":"assistant-1"}\n\n',
    })
  })
  const playback = page.waitForRequest('**/api/v1/messages/server-message/voice-recording')
  await page.route('**/api/v1/messages/server-message/voice-recording', (route) =>
    route.fulfill({
      json: envelope({
        url: '/mock-play',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    }),
  )

  await page.goto('/chat/voice-chat')
  const microphone = page.getByRole('button', { name: '长按语音输入' })
  await microphone.dispatchEvent('pointerdown')
  await expect(page.getByRole('dialog', { name: '语音输入' })).toBeVisible()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: '结束并发送' }).click()
  await expect(page.getByRole('button', { name: '播放原音' })).toBeVisible()
  expect(streamBody).toMatchObject({ voiceRecordingId: 'recording-1' })
  expect(streamBody?.content).toBeUndefined()
  await page.getByRole('button', { name: '播放原音' }).click()
  await playback
})

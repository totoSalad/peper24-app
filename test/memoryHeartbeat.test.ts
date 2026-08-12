import assert from 'node:assert/strict'
import test from 'node:test'
import { startMemoryHeartbeat } from '../src/memoryHeartbeat.ts'

test('triggers memory extraction on the configured heartbeat interval and stops cleanly', async () => {
  const originalWindow = globalThis.window
  let scheduled: (() => void) | undefined
  let configuredInterval = 0
  let clearedId: number | undefined
  globalThis.window = {
    setInterval(callback: () => void, interval: number) {
      scheduled = callback
      configuredInterval = interval
      return 42
    },
    clearInterval(id: number) {
      clearedId = id
    },
  } as unknown as Window & typeof globalThis

  try {
    let calls = 0
    const stop = startMemoryHeartbeat(async () => {
      calls += 1
    }, 1_200_000)

    assert.equal(calls, 0)
    assert.equal(configuredInterval, 1_200_000)
    scheduled?.()
    await Promise.resolve()
    assert.equal(calls, 1)
    stop()
    assert.equal(clearedId, 42)
  } finally {
    globalThis.window = originalWindow
  }
})

test('does not overlap slow heartbeat requests', async () => {
  const originalWindow = globalThis.window
  let scheduled: (() => void) | undefined
  globalThis.window = {
    setInterval(callback: () => void) {
      scheduled = callback
      return 42
    },
    clearInterval() {},
  } as unknown as Window & typeof globalThis

  try {
    let calls = 0
    let resolveRequest: (() => void) | undefined
    const stop = startMemoryHeartbeat(() => {
      calls += 1
      return new Promise<void>((resolve) => {
        resolveRequest = resolve
      })
    })

    scheduled?.()
    scheduled?.()
    assert.equal(calls, 1)
    resolveRequest?.()
    await new Promise((resolve) => setTimeout(resolve, 0))
    scheduled?.()
    assert.equal(calls, 2)
    stop()
  } finally {
    globalThis.window = originalWindow
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createClientId } from '../src/clientId.ts'

test('uses randomUUID when the browser provides it', () => {
  const id = createClientId({
    randomUUID: () => 'native-uuid',
    getRandomValues: () => {
      throw new Error('fallback should not run')
    },
  })

  assert.equal(id, 'native-uuid')
})

test('creates an RFC 4122 v4 UUID when randomUUID is unavailable', () => {
  const id = createClientId({
    getRandomValues: (bytes) => {
      bytes.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
      return bytes
    },
  })

  assert.equal(id, '00010203-0405-4607-8809-0a0b0c0d0e0f')
})

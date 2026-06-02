import assert from 'node:assert/strict'
import test from 'node:test'
import { createErrorFingerprint, ErrorDeduplicator } from './error-plugin.ts'

test('creates stable fingerprints from error identity fields', () => {
  assert.equal(
    createErrorFingerprint({
      kind: 'runtime',
      message: 'boom',
      filename: 'app.js',
      line: 10,
      column: 2,
    }),
    'runtime|boom|app.js|10|2',
  )
})

test('suppresses duplicate fingerprints within the configured window', () => {
  let now = 1000
  const deduplicator = new ErrorDeduplicator(500, () => now)

  assert.equal(deduplicator.shouldReport('same'), true)
  assert.equal(deduplicator.shouldReport('same'), false)
  now = 1501
  assert.equal(deduplicator.shouldReport('same'), true)
})

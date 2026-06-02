import assert from 'node:assert/strict'
import test from 'node:test'
import { INTERNAL_REQUEST_HEADER, isInternalRequest, sanitizeUrl } from './behavior-plugin.ts'

test('removes query strings and hashes from captured urls', () => {
  assert.equal(sanitizeUrl('https://example.test/profile?token=secret#tab'), 'https://example.test/profile')
})

test('detects sdk requests by internal marker header', () => {
  assert.equal(isInternalRequest({ headers: { [INTERNAL_REQUEST_HEADER]: '1' } }), true)
  assert.equal(isInternalRequest({ headers: { accept: 'application/json' } }), false)
})

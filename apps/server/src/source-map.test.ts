import assert from 'node:assert/strict'
import test from 'node:test'
import { createDatabase } from './db.ts'
import { restoreFrame, saveSourceMap } from './source-map.ts'

test('stores source maps and restores generated positions', () => {
  const db = createDatabase(':memory:')
  saveSourceMap(db, {
    appId: 'demo',
    release: '1.0.0',
    generatedFile: 'app.js',
    map: {
      version: 3,
      file: 'app.js',
      sources: ['src/app.ts'],
      names: [],
      mappings: 'AAAA',
    },
  })

  assert.deepEqual(restoreFrame(db, { appId: 'demo', release: '1.0.0', generatedFile: 'app.js', line: 1, column: 0 }), {
    source: 'src/app.ts',
    line: 1,
    column: 0,
  })
})

test('returns the generated position when no source map matches', () => {
  const db = createDatabase(':memory:')

  assert.deepEqual(restoreFrame(db, { appId: 'demo', release: '1.0.0', generatedFile: 'missing.js', line: 4, column: 2 }), {
    source: 'missing.js',
    line: 4,
    column: 2,
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { EventBus } from '../core/event-bus.ts'
import type { MonitorBusEvents } from '../core/types.ts'
import { createWhiteScreenPlugin, isWhiteScreen } from './white-screen-plugin.ts'

function documentWith(node: unknown) {
  return {
    readyState: 'complete',
    querySelector() {
      return node
    },
  }
}

test('detects white screen when the root container has no visible content', () => {
  assert.equal(isWhiteScreen(documentWith({ textContent: '   ', children: [] })), true)
})

test('does not report white screen when the root container has text content', () => {
  assert.equal(isWhiteScreen(documentWith({ textContent: '页面已渲染', children: [] })), false)
})

test('reports white screen as an error event through the monitor context', async () => {
  const bus = new EventBus<MonitorBusEvents>()
  const captured: Array<{ type: string; payload: any }> = []
  createWhiteScreenPlugin({
    delay: 0,
    document: documentWith({ textContent: '', children: [] }) as unknown as Document,
  }).setup(bus, {
    endpoint: '/events',
    sessionId: 'session',
    capture(type, payload) {
      captured.push({ type, payload })
    },
  })

  bus.emit('lifecycle:start', undefined)
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.deepEqual(captured, [
    {
      type: 'error',
      payload: {
        kind: 'white-screen',
        message: '检测到页面白屏',
        fingerprint: 'white-screen|#root,#app',
        selectors: ['#root', '#app'],
      },
    },
  ])
})

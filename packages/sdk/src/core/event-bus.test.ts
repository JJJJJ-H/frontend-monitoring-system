import assert from 'node:assert/strict'
import test from 'node:test'
import { EventBus } from './event-bus.ts'

interface TestEvents {
  message: string
}

test('notifies subscribers and supports unsubscribe', () => {
  const bus = new EventBus<TestEvents>()
  const received: string[] = []
  const unsubscribe = bus.on('message', (message) => received.push(message))

  bus.emit('message', 'first')
  unsubscribe()
  bus.emit('message', 'second')

  assert.deepEqual(received, ['first'])
})

test('continues notifying subscribers after a subscriber throws', () => {
  const errors: unknown[] = []
  const bus = new EventBus<TestEvents>((error) => errors.push(error))
  const received: string[] = []

  bus.on('message', () => {
    throw new Error('subscriber failed')
  })
  bus.on('message', (message) => received.push(message))

  bus.emit('message', 'still delivered')

  assert.deepEqual(received, ['still delivered'])
  assert.equal(errors.length, 1)
})

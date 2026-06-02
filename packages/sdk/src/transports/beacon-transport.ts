import type { Transport } from './types.ts'

export function createBeaconTransport(endpoint: string, sendBeacon = globalThis.navigator?.sendBeacon?.bind(globalThis.navigator)): Transport {
  return {
    name: 'beacon',
    async send(events) {
      return sendBeacon?.(endpoint, JSON.stringify({ events })) ?? false
    },
  }
}

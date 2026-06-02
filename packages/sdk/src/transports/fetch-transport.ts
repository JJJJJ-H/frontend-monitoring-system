import { INTERNAL_REQUEST_HEADER } from '../plugins/behavior-plugin.ts'
import type { Transport } from './types.ts'

export function createFetchTransport(endpoint: string, request: typeof fetch = globalThis.fetch): Transport {
  return {
    name: 'fetch',
    async send(events) {
      if (!request) return false
      try {
        const response = await request(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', [INTERNAL_REQUEST_HEADER]: '1' },
          body: JSON.stringify({ events }),
          keepalive: true,
        })
        return response.ok
      } catch {
        return false
      }
    },
  }
}

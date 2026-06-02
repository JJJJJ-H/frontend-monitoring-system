import type { Transport } from './types.ts'

export function createImageTransport(endpoint: string): Transport {
  return {
    name: 'image',
    async send(events) {
      if (!globalThis.Image) return false
      const image = new Image()
      image.src = `${endpoint}?data=${encodeURIComponent(JSON.stringify({ events }))}`
      return true
    },
  }
}

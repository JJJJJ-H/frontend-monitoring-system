import type { MonitorPlugin, PluginContext } from '../core/plugin.ts'
import { sanitizeText } from '../core/privacy.ts'

export const INTERNAL_REQUEST_HEADER = 'x-monitor-internal'

export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value, globalThis.location?.href)
    return `${url.origin}${url.pathname}`
  } catch {
    return value.split(/[?#]/, 1)[0]
  }
}

export function isInternalRequest(input: { headers?: HeadersInit }): boolean {
  const headers = new Headers(input.headers)
  return headers.get(INTERNAL_REQUEST_HEADER) === '1'
}

export function markInternalHeaders(headers?: HeadersInit): Headers {
  const result = new Headers(headers)
  result.set(INTERNAL_REQUEST_HEADER, '1')
  return result
}

export function createBehaviorPlugin(target: Window = globalThis.window): MonitorPlugin {
  let context: PluginContext | undefined
  const captureRoute = () => context?.capture('behavior:route', { url: sanitizeUrl(target.location.href) })
  const captureClick = (event: MouseEvent) => {
    const element = event.target as HTMLElement | null
    context?.capture('behavior:click', {
      tag: element?.tagName?.toLowerCase() ?? '',
      text: sanitizeText(element?.textContent ?? ''),
      id: element?.id ?? '',
    })
  }

  return {
    name: 'behavior',
    setup(bus, pluginContext) {
      context = pluginContext
      bus.on('lifecycle:start', () => {
        target?.addEventListener('click', captureClick, true)
        target?.addEventListener('popstate', captureRoute)
        target?.addEventListener('hashchange', captureRoute)
      })
      bus.on('lifecycle:stop', () => {
        target?.removeEventListener('click', captureClick, true)
        target?.removeEventListener('popstate', captureRoute)
        target?.removeEventListener('hashchange', captureRoute)
      })
    },
  }
}

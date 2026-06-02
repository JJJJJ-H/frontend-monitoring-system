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
  let originalFetch: typeof fetch | undefined
  let originalOpen: typeof XMLHttpRequest.prototype.open | undefined
  let originalSend: typeof XMLHttpRequest.prototype.send | undefined
  let originalPushState: typeof history.pushState | undefined
  let originalReplaceState: typeof history.replaceState | undefined
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
        originalPushState = target.history.pushState.bind(target.history)
        originalReplaceState = target.history.replaceState.bind(target.history)
        target.history.pushState = (...args) => { originalPushState!(...args); captureRoute() }
        target.history.replaceState = (...args) => { originalReplaceState!(...args); captureRoute() }
        originalFetch = target.fetch?.bind(target)
        if (originalFetch) {
          target.fetch = async (input, init = {}) => {
            if (isInternalRequest(init)) return originalFetch!(input, init)
            const startedAt = Date.now()
            try {
              const response = await originalFetch!(input, init)
              context?.capture('behavior:request', { kind: 'fetch', url: sanitizeUrl(String(input)), method: init.method ?? 'GET', status: response.status, duration: Date.now() - startedAt })
              return response
            } catch (error) {
              context?.capture('behavior:request', { kind: 'fetch', url: sanitizeUrl(String(input)), method: init.method ?? 'GET', status: 0, duration: Date.now() - startedAt })
              throw error
            }
          }
        }
        const xhr = globalThis.XMLHttpRequest?.prototype
        if (xhr) {
          originalOpen = xhr.open
          originalSend = xhr.send
          xhr.open = function (method: string, url: string | URL, ...rest: any[]) {
            ;(this as any).__monitorRequest = { method, url: sanitizeUrl(String(url)), startedAt: Date.now() }
            return (originalOpen as any).call(this, method, url, ...rest)
          }
          xhr.send = function (...args: any[]) {
            this.addEventListener('loadend', () => {
              const request = (this as any).__monitorRequest
              if (request) context?.capture('behavior:request', { kind: 'xhr', ...request, status: this.status, duration: Date.now() - request.startedAt })
            }, { once: true })
            return originalSend!.apply(this, args as [Document | XMLHttpRequestBodyInit | null | undefined])
          }
        }
      })
      bus.on('lifecycle:stop', () => {
        target?.removeEventListener('click', captureClick, true)
        target?.removeEventListener('popstate', captureRoute)
        target?.removeEventListener('hashchange', captureRoute)
        if (originalPushState) target.history.pushState = originalPushState
        if (originalReplaceState) target.history.replaceState = originalReplaceState
        if (originalFetch) target.fetch = originalFetch
        const xhr = globalThis.XMLHttpRequest?.prototype
        if (xhr && originalOpen && originalSend) {
          xhr.open = originalOpen
          xhr.send = originalSend
        }
      })
    },
  }
}

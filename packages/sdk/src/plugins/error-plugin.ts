import type { MonitorPlugin, PluginContext } from '../core/plugin.ts'

export interface ErrorIdentity {
  kind: 'runtime' | 'promise' | 'resource'
  message: string
  filename?: string
  line?: number
  column?: number
}

export function createErrorFingerprint(error: ErrorIdentity): string {
  return [error.kind, error.message, error.filename ?? '', error.line ?? '', error.column ?? ''].join('|')
}

export class ErrorDeduplicator {
  private readonly seen = new Map<string, number>()
  private readonly windowMs: number
  private readonly clock: () => number

  constructor(windowMs = 5000, clock: () => number = Date.now) {
    this.windowMs = windowMs
    this.clock = clock
  }

  shouldReport(fingerprint: string): boolean {
    const now = this.clock()
    const previous = this.seen.get(fingerprint)
    this.seen.set(fingerprint, now)
    return previous === undefined || now - previous > this.windowMs
  }
}

interface EventTargetLike {
  addEventListener(type: string, listener: (event: any) => void, options?: boolean): void
  removeEventListener(type: string, listener: (event: any) => void, options?: boolean): void
}

export function createErrorPlugin(target: EventTargetLike = globalThis.window): MonitorPlugin {
  const deduplicator = new ErrorDeduplicator()
  let context: PluginContext | undefined

  const capture = (identity: ErrorIdentity, stack?: string) => {
    const fingerprint = createErrorFingerprint(identity)
    if (deduplicator.shouldReport(fingerprint)) {
      context?.capture('error', { ...identity, fingerprint, stack })
    }
  }
  const onError = (event: any) => {
    const resource = event.target
    if (resource && resource !== target && (resource.src || resource.href)) {
      capture({ kind: 'resource', message: `Failed to load ${resource.src ?? resource.href}`, filename: resource.src ?? resource.href })
      return
    }
    capture(
      {
        kind: 'runtime',
        message: event.message ?? event.error?.message ?? 'Unknown runtime error',
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      },
      event.error?.stack,
    )
  }
  const onRejection = (event: any) => {
    const reason = event.reason
    capture({ kind: 'promise', message: reason?.message ?? String(reason) }, reason?.stack)
  }

  return {
    name: 'error',
    setup(bus, pluginContext) {
      context = pluginContext
      bus.on('lifecycle:start', () => {
        target?.addEventListener('error', onError, true)
        target?.addEventListener('unhandledrejection', onRejection)
      })
      bus.on('lifecycle:stop', () => {
        target?.removeEventListener('error', onError, true)
        target?.removeEventListener('unhandledrejection', onRejection)
      })
    },
  }
}

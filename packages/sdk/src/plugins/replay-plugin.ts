import type { MonitorPlugin, PluginContext } from '../core/plugin.ts'

export interface ReplayOptions {
  record?: (options: Record<string, unknown>) => (() => void) | void
  emitEvery?: number
}

export function createReplayPlugin(options: ReplayOptions = {}): MonitorPlugin {
  let stop: (() => void) | undefined
  let context: PluginContext | undefined
  let events: unknown[] = []

  return {
    name: 'replay',
    setup(bus, pluginContext) {
      context = pluginContext
      bus.on('lifecycle:start', () => {
        stop = options.record?.({
          maskAllInputs: true,
          blockClass: 'monitor-block',
          ignoreClass: 'monitor-ignore',
          emit(event: unknown) {
            events.push(event)
            if (events.length >= (options.emitEvery ?? 20)) {
              context?.capture('replay', { events })
              events = []
            }
          },
        })
      })
      bus.on('lifecycle:stop', () => {
        stop?.()
        stop = undefined
        if (events.length) context?.capture('replay', { events })
        events = []
      })
    },
  }
}

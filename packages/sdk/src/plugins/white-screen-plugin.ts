import type { MonitorPlugin, PluginContext } from '../core/plugin.ts'

export interface WhiteScreenOptions {
  selectors?: string[]
  delay?: number
  document?: Document
}

interface InspectableElement {
  textContent?: string | null
  children?: ArrayLike<InspectableElement>
  tagName?: string
}

const visibleTags = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME'])

function hasVisibleContent(element: InspectableElement | null | undefined): boolean {
  if (!element) return false
  if (element.textContent?.trim()) return true
  if (visibleTags.has(element.tagName ?? '')) return true
  for (const child of Array.from(element.children ?? [])) {
    if (hasVisibleContent(child)) return true
  }
  return false
}

export function isWhiteScreen(documentLike: Pick<Document, 'querySelector'>, selectors = ['#root', '#app']): boolean {
  return selectors.every((selector) => !hasVisibleContent(documentLike.querySelector(selector) as InspectableElement | null))
}

export function createWhiteScreenPlugin(options: WhiteScreenOptions = {}): MonitorPlugin {
  const selectors = options.selectors ?? ['#root', '#app']
  const delay = options.delay ?? 3000
  const documentLike = options.document ?? globalThis.document
  let timer: ReturnType<typeof setTimeout> | undefined
  let context: PluginContext | undefined
  let reported = false

  const check = () => {
    if (reported || !documentLike) return
    if (!isWhiteScreen(documentLike, selectors)) return
    reported = true
    context?.capture('error', {
      kind: 'white-screen',
      message: '检测到页面白屏',
      fingerprint: `white-screen|${selectors.join(',')}`,
      selectors,
    })
  }

  return {
    name: 'white-screen',
    setup(bus, pluginContext) {
      context = pluginContext
      bus.on('lifecycle:start', () => {
        timer = setTimeout(check, delay)
      })
      bus.on('lifecycle:stop', () => {
        if (timer) clearTimeout(timer)
        timer = undefined
      })
    },
  }
}

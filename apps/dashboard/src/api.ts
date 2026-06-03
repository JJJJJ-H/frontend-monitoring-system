const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const appId = import.meta.env.VITE_APP_ID ?? 'react-demo'

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}${path.includes('?') ? '&' : '?'}appId=${encodeURIComponent(appId)}`)
  if (!response.ok) throw new Error(`请求失败：${response.status}`)
  return response.json()
}

export const api = {
  overview: () => get<{ errors: number; sessions: number; events: number; performance: number }>('/api/overview'),
  errors: () => get<Array<{ fingerprint: string; message: string; count: number; latestTimestamp: number }>>('/api/errors'),
  performance: () => get<Array<{ type: string; timestamp: number; duration: number; name: string }>>('/api/performance'),
  sessions: () => get<Array<{ sessionId: string; startedAt: number; endedAt: number; eventCount: number }>>('/api/sessions'),
  replay: (sessionId: string) => get<unknown[]>(`/api/sessions/${encodeURIComponent(sessionId)}/replay`),
}

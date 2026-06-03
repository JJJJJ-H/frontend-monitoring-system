import { api } from '../api'
import { useApi } from '../hooks'

export function SessionsPage({ openReplay }: { openReplay(sessionId: string): void }) {
  const { data, error } = useApi(api.sessions, [])
  return <section><h2>录屏会话</h2>{error && <p className="error">{error}</p>}<table><thead><tr><th>会话 ID</th><th>事件数</th><th>开始时间</th><th /></tr></thead><tbody>
    {data.map((session) => <tr key={session.sessionId}><td><code>{session.sessionId}</code></td><td>{session.eventCount}</td><td>{new Date(session.startedAt).toLocaleString()}</td><td><button onClick={() => openReplay(session.sessionId)}>查看回放</button></td></tr>)}
  </tbody></table>{!data.length && <p className="empty">暂无录屏会话。</p>}</section>
}

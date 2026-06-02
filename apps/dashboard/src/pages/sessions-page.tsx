import { api } from '../api'
import { useApi } from '../hooks'

export function SessionsPage({ openReplay }: { openReplay(sessionId: string): void }) {
  const { data, error } = useApi(api.sessions, [])
  return <section><h2>Replay Sessions</h2>{error && <p className="error">{error}</p>}<table><thead><tr><th>Session</th><th>Events</th><th>Started</th><th /></tr></thead><tbody>
    {data.map((session) => <tr key={session.sessionId}><td><code>{session.sessionId}</code></td><td>{session.eventCount}</td><td>{new Date(session.startedAt).toLocaleString()}</td><td><button onClick={() => openReplay(session.sessionId)}>Replay</button></td></tr>)}
  </tbody></table>{!data.length && <p className="empty">No replay sessions captured yet.</p>}</section>
}

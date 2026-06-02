import { api } from '../api'
import { useApi } from '../hooks'

export function ErrorsPage() {
  const { data, error } = useApi(api.errors, [])
  return <section><h2>Grouped Errors</h2>{error && <p className="error">{error}</p>}<table><thead><tr><th>Message</th><th>Fingerprint</th><th>Count</th><th>Latest</th></tr></thead><tbody>
    {data.map((item) => <tr key={item.fingerprint}><td>{item.message}</td><td><code>{item.fingerprint}</code></td><td>{item.count}</td><td>{new Date(item.latestTimestamp).toLocaleString()}</td></tr>)}
  </tbody></table>{!data.length && <p className="empty">No errors captured yet.</p>}</section>
}

import { api } from '../api'
import { useApi } from '../hooks'

export function ErrorsPage() {
  const { data, error } = useApi(api.errors, [])
  return <section><h2>错误聚合</h2>{error && <p className="error">{error}</p>}<table><thead><tr><th>错误信息</th><th>错误指纹</th><th>次数</th><th>最近发生</th></tr></thead><tbody>
    {data.map((item) => <tr key={item.fingerprint}><td>{item.message}</td><td><code>{item.fingerprint}</code></td><td>{item.count}</td><td>{new Date(item.latestTimestamp).toLocaleString()}</td></tr>)}
  </tbody></table>{!data.length && <p className="empty">暂无错误数据。</p>}</section>
}

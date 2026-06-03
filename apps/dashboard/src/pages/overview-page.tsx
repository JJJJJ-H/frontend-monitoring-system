import { api } from '../api'
import { useApi } from '../hooks'

export function OverviewPage() {
  const { data, error } = useApi(api.overview, { errors: 0, sessions: 0, events: 0, performance: 0 })
  const labels: Record<string, string> = { errors: '错误数', sessions: '会话数', events: '事件数', performance: '性能事件' }
  return <section><h2>总览</h2>{error && <p className="error">{error}</p>}<div className="cards">
    {Object.entries(data).map(([label, value]) => <article className="card" key={label}><span>{labels[label] ?? label}</span><strong>{value}</strong></article>)}
  </div></section>
}

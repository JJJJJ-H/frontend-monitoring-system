import { api } from '../api'
import { useApi } from '../hooks'

function behaviorName(type: string) {
  if (type === 'behavior:click') return '点击'
  if (type === 'behavior:route') return '路由'
  if (type === 'behavior:request') return '请求'
  return type
}

function behaviorDetail(item: { type: string; tag: string; text: string; url: string; method: string; status: number | null; duration: number | null }) {
  if (item.type === 'behavior:click') return `${item.tag || '元素'}${item.text ? `：${item.text}` : ''}`
  if (item.type === 'behavior:route') return item.url
  if (item.type === 'behavior:request') return `${item.method || 'GET'} ${item.url}，状态 ${item.status ?? '-'}，耗时 ${item.duration ?? '-'}ms`
  return ''
}

export function BehaviorPage() {
  const { data, error } = useApi(api.behaviors, [])
  const counts = data.reduce<Record<string, number>>((result, item) => {
    result[item.type] = (result[item.type] ?? 0) + 1
    return result
  }, {})

  return <section><h2>用户行为</h2>{error && <p className="error">{error}</p>}
    <div className="cards behavior-summary">
      <article className="card"><span>点击行为</span><strong>{counts['behavior:click'] ?? 0}</strong></article>
      <article className="card"><span>路由变化</span><strong>{counts['behavior:route'] ?? 0}</strong></article>
      <article className="card"><span>请求行为</span><strong>{counts['behavior:request'] ?? 0}</strong></article>
    </div>
    <table><thead><tr><th>时间</th><th>类型</th><th>行为详情</th><th>页面</th><th>会话</th></tr></thead><tbody>
      {data.map((item) => <tr key={`${item.timestamp}-${item.type}-${item.sessionId}`}>
        <td>{new Date(item.timestamp).toLocaleString()}</td>
        <td>{behaviorName(item.type)}</td>
        <td>{behaviorDetail(item)}</td>
        <td><code>{item.pageUrl}</code></td>
        <td><code>{item.sessionId}</code></td>
      </tr>)}
    </tbody></table>{!data.length && <p className="empty">暂无用户行为数据。</p>}</section>
}

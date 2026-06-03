import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import { useApi } from '../hooks'

interface PerformanceMetricMeta {
  title: string
  unit: string
  good: number
  needsImprovement: number
  description: string
}

const metricMeta: Record<string, PerformanceMetricMeta> = {
  CLS: {
    title: 'CLS 布局偏移',
    unit: '',
    good: 0.1,
    needsImprovement: 0.25,
    description: '衡量页面视觉稳定性，越低越好。小于 0.1 表示体验良好。',
  },
  INP: {
    title: 'INP 交互延迟',
    unit: 'ms',
    good: 200,
    needsImprovement: 500,
    description: '衡量用户交互后的响应速度，越低越好。小于 200ms 表示体验良好。',
  },
  LCP: {
    title: 'LCP 最大内容绘制',
    unit: 'ms',
    good: 2500,
    needsImprovement: 4000,
    description: '衡量主要内容加载速度，越低越好。小于 2500ms 表示体验良好。',
  },
  longtask: {
    title: '长任务耗时',
    unit: 'ms',
    good: 50,
    needsImprovement: 100,
    description: '浏览器主线程单个任务超过 50ms 会影响流畅度，越低越好。',
  },
  resource: {
    title: '资源加载耗时',
    unit: 'ms',
    good: 500,
    needsImprovement: 1500,
    description: '静态资源或接口资源加载时间，越低越好。',
  },
}

function getMetricKey(item: { type: string; name: string }) {
  if (item.type === 'performance:vital') return item.name || 'Web Vital'
  return item.type.replace('performance:', '')
}

function getMeta(key: string): PerformanceMetricMeta {
  return metricMeta[key] ?? {
    title: key,
    unit: 'ms',
    good: 100,
    needsImprovement: 300,
    description: '自定义性能指标，数值越低通常越好。',
  }
}

function getStatus(value: number, meta: PerformanceMetricMeta) {
  if (value <= meta.good) return { text: '良好', className: 'good' }
  if (value <= meta.needsImprovement) return { text: '需关注', className: 'warn' }
  return { text: '较差', className: 'bad' }
}

function formatValue(value: number, unit: string) {
  const precision = unit === 'ms' ? 0 : 3
  return `${value.toFixed(precision)}${unit}`
}

export function PerformancePage() {
  const { data, error } = useApi(api.performance, [])
  const groups = data.reduce<Record<string, Array<(typeof data)[number] & { displayTime: string }>>>((result, item) => {
    const key = getMetricKey(item)
    result[key] ??= []
    result[key].push({ ...item, displayTime: new Date(item.timestamp).toLocaleTimeString() })
    return result
  }, {})

  return <section><h2>性能趋势</h2>{error && <p className="error">{error}</p>}
    <div className="metric-guide"><h3>指标参照</h3><ul>
      <li><strong>良好</strong>：低于绿色阈值，用户体验正常。</li>
      <li><strong>需关注</strong>：介于绿色和橙色阈值之间，建议继续观察。</li>
      <li><strong>较差</strong>：高于橙色阈值，需要优先排查。</li>
    </ul></div>
    {Object.entries(groups).map(([key, points]) => {
      const meta = getMeta(key)
      const latest = points.at(-1)!
      const status = getStatus(latest.value, meta)
      return <article className="metric-panel" key={key}>
        <header><div><h3>{meta.title}</h3><p>{meta.description}</p></div><div className={`metric-status ${status.className}`}>
          <span>{status.text}</span><strong>{formatValue(latest.value, meta.unit)}</strong>
        </div></header>
        <div className="thresholds">
          <span>良好 ≤ {formatValue(meta.good, meta.unit)}</span>
          <span>需关注 ≤ {formatValue(meta.needsImprovement, meta.unit)}</span>
          <span>当前样本 {points.length} 条</span>
        </div>
        <div className="chart">
          <ResponsiveContainer><BarChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis dataKey="displayTime" />
            <YAxis unit={meta.unit} domain={[0, 'auto']} />
            <Tooltip formatter={(value) => [formatValue(Number(value), meta.unit), meta.title]} labelFormatter={(label) => `时间：${label}`} />
            <ReferenceLine y={meta.good} stroke="#3fb950" strokeDasharray="4 4" label="良好线" />
            <ReferenceLine y={meta.needsImprovement} stroke="#d29922" strokeDasharray="4 4" label="关注线" />
            <Bar dataKey="value" fill="#58a6ff" name={meta.title} />
          </BarChart></ResponsiveContainer>
        </div>
      </article>
    })}
    {!data.length && <p className="empty">暂无性能数据。</p>}
  </section>
}

import { useState } from 'react'
import { monitor } from './monitor'

export function App() {
  const [route, setRoute] = useState('首页')
  return <main><h1>React 监控示例</h1><p>点击下面的按钮触发采集，然后到监控看板查看数据。</p>
    <button onClick={() => { throw new Error('React 示例运行时错误') }}>触发运行时错误</button>
    <button onClick={() => Promise.reject(new Error('React 示例 Promise 拒绝'))}>触发 Promise 拒绝</button>
    <button onClick={() => fetch('/missing-api')}>触发失败请求</button>
    <button onClick={() => { history.pushState({}, '', `#/${route === '首页' ? '个人页' : '首页'}`); setRoute(route === '首页' ? '个人页' : '首页') }}>触发路由变化</button>
    <button onClick={() => monitor.flush()}>立即上报数据</button>
    <label>录屏脱敏输入 <input placeholder="这里的输入会在回放中脱敏" /></label>
    <p>当前路由：{route}</p>
  </main>
}

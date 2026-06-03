<script setup lang="ts">
defineProps<{ monitor: { flush(): void } }>()
const runtimeError = () => { throw new Error('Vue 示例运行时错误') }
const rejectedPromise = () => Promise.reject(new Error('Vue 示例 Promise 拒绝'))
const changeRoute = () => history.pushState({}, '', `#/profile-${Date.now()}`)
const failedRequest = () => fetch('/missing-api')
</script>
<template>
  <main><h1>Vue 监控示例</h1><p>点击下面的按钮触发采集，然后到监控看板查看数据。</p>
    <button @click="runtimeError">触发运行时错误</button><button @click="rejectedPromise">触发 Promise 拒绝</button>
    <button @click="failedRequest">触发失败请求</button><button @click="changeRoute">触发路由变化</button>
    <button @click="monitor.flush()">立即上报数据</button><label>录屏脱敏输入 <input placeholder="这里的输入会在回放中脱敏" /></label>
  </main>
</template>
<style>body { font-family: system-ui; margin: 40px; } button, input { display: block; margin: 12px 0; padding: 8px 12px; }</style>

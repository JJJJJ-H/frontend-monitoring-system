<script setup lang="ts">
defineProps<{ monitor: { flush(): void } }>()
const runtimeError = () => { throw new Error('Vue demo runtime error') }
const rejectedPromise = () => Promise.reject(new Error('Vue demo rejected promise'))
const changeRoute = () => history.pushState({}, '', `#/profile-${Date.now()}`)
const failedRequest = () => fetch('/missing-api')
</script>
<template>
  <main><h1>Vue Monitoring Demo</h1><p>Use these controls, then inspect PulseBoard.</p>
    <button @click="runtimeError">Runtime error</button><button @click="rejectedPromise">Rejected promise</button>
    <button @click="failedRequest">Failed request</button><button @click="changeRoute">Route change</button>
    <button @click="monitor.flush()">Flush telemetry</button><label>Replay-safe input <input placeholder="Input is masked in replay" /></label>
  </main>
</template>
<style>body { font-family: system-ui; margin: 40px; } button, input { display: block; margin: 12px 0; padding: 8px 12px; }</style>

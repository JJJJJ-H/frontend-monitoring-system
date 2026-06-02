import { spawn } from 'node:child_process'

const workspaces = ['@monitor/server', '@monitor/dashboard', '@monitor/react-demo', '@monitor/vue-demo']
const children = workspaces.map((workspace) => spawn('npm', ['run', 'dev', '--workspace', workspace], { shell: true, stdio: 'inherit' }))
const stop = () => children.forEach((child) => child.kill())
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

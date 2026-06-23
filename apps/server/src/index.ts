import { createServer } from 'node:http'
import { getServerConfig } from './config.ts'
import { createDatabase } from './db.ts'
import { createRequestListener } from './http.ts'

const config = getServerConfig()
const port = Number(process.env.PORT ?? 3000)

createServer(createRequestListener(createDatabase(), config)).listen(port, () => {
  console.log(`monitor server listening on http://localhost:${port}`)
})

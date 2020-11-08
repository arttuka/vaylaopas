import * as fs from 'fs'
import * as path from 'path'
import { Config, Stats } from '../common/types'

let config: Config

const statsFile = path.resolve('./dist/stats.json')
let bundle = 'bundle.js'
if (process.env.NODE_ENV === 'production' && fs.existsSync(statsFile)) {
  const stats: Stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'))
  bundle = stats.assetsByChunkName.bundle[0]
}
const configFile = path.resolve('./config.json')
if (fs.existsSync(configFile)) {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
  config.server.bundle = bundle
} else {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  config = {
    client: {
      mapserver: process.env.MAPSERVER!,
    },
    db: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT!, 10),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    },
    server: {
      host: process.env.HOST!,
      port: parseInt(process.env.PORT!, 10),
      bundle,
    },
  }
  /* eslint-enable */
}

export default config

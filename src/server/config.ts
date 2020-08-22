import * as fs from 'fs'
import * as path from 'path'
import { Config } from '../common/types'

let config: Config

const manifest = path.resolve('./dist/server/manifest.json')
const bundle =
  process.env.NODE_ENV === 'production' && fs.existsSync(manifest)
    ? JSON.parse(fs.readFileSync(manifest, 'utf8'))['bundle.js']
    : 'bundle.js'
const configFile = path.resolve('config.json')
if (process.env.NODE_ENV === 'development' && fs.existsSync(configFile)) {
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

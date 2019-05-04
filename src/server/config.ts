import * as fs from 'fs'
import * as path from 'path'
import { Config } from '../common/types'

let config: Config

const configFile = path.resolve('config.json')
if (process.env.NODE_ENV === 'development' && fs.existsSync(configFile)) {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
} else {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  config = {
    client: {
      mapserver: process.env.MAPSERVER!,
    },
    server: {
      port: parseInt(process.env.SERVER_PORT!, 10),
    },
    db: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT!, 10),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    },
  }
  /* eslint-enable */
}

export default config

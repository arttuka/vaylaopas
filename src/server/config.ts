import * as fs from 'fs'
import * as path from 'path'
import { Config } from '../common/types'

const configFile = path.resolve('./config.json')

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const config: Config = fs.existsSync(configFile)
  ? JSON.parse(fs.readFileSync(configFile, 'utf8'))
  : {
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
      },
    }
/* eslint-enable */

export default config

import * as fs from 'fs'
import * as path from 'path'

interface Config {
  db: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
}

let config: Config

const configFile = path.join(__dirname, '..', '..', 'config.json')
if(fs.existsSync(configFile)) {
  config = require('../../config.json')
} else {
  config = {
    db: {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT!, 10),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    }
  }
}

export default config

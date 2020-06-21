import app from './app'
import cfg from './config'

const { port } = cfg.server

app.listen(port, (): void => console.log(`Listening on port ${port}`))

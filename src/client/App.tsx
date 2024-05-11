import React, { FC, useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack'
import { styled } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import StyledEngineProvider from '@mui/material/StyledEngineProvider'
import store from './redux/store'
import { getConfig } from './api'
import AppBar from './Appbar/Appbar'
import MapContainer from './Map/MapContainer'
import Notifier from './Notifier/Notifier'
import BottomDrawer from './InformationPanel/BottomDrawer'
import InformationPanel from './InformationPanel/InformationPanel'
import { ClientConfig } from '../common/types'

const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  height: '100vh',
})

const App: FC = () => {
  const [config, setConfig] = useState<ClientConfig>()
  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      setConfig(await getConfig())
    }
    loadConfig()
  }, [])

  return config === undefined ? null : (
    <Container>
      <Notifier />
      <AppBar />
      <InformationPanel />
      <MapContainer mapserverUrl={config.mapserver} />
      <BottomDrawer />
    </Container>
  )
}

const WrappedApp: FC = () => (
  <Provider store={store}>
    <StyledEngineProvider injectFirst>
      <SnackbarProvider>
        <CssBaseline />
        <App />
      </SnackbarProvider>
    </StyledEngineProvider>
  </Provider>
)

export default WrappedApp

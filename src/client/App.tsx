import React, { FunctionComponent, useState } from 'react'
import { styled } from '@material-ui/core/styles'
import AppBar from './Appbar/Appbar'
import MapContainer from './Map/MapContainer'
import Notifier from './Notifier/Notifier'
import Sidebar from './Sidebar/Sidebar'
import RouteList from './Sidebar/RouteList'
import SettingsContainer from './Sidebar/SettingsContainer'

const Container = styled('div')({
  display: 'flex',
  'flex-direction': 'column',
  position: 'relative',
  height: '100vh',
})

const App: FunctionComponent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Container>
      <Notifier />
      <AppBar openSidebar={(): void => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        onOpen={(): void => setSidebarOpen(true)}
        onClose={(): void => setSidebarOpen(false)}
      >
        <RouteList />
        <SettingsContainer />
      </Sidebar>
      <MapContainer />
    </Container>
  )
}

export default App

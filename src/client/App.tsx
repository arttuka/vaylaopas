import React, { FunctionComponent, useState } from 'react'
import AppBar from './Appbar/Appbar'
import Map from './Map/Map'
import Notifier from './Notifier/Notifier'
import Sidebar from './Sidebar/Sidebar'
import RouteList from './Sidebar/RouteList'
import SettingsContainer from './Sidebar/SettingsContainer'

const App: FunctionComponent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
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
      <Map />
    </>
  )
}

export default App

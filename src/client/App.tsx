import React, { FunctionComponent } from 'react'
import { styled } from '@mui/material/styles'
import AppBar from './Appbar/Appbar'
import MapContainer from './Map/MapContainer'
import Notifier from './Notifier/Notifier'
import BottomDrawer from './InformationPanel/BottomDrawer'
import InformationPanel from './InformationPanel/InformationPanel'

const Container = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  height: '100vh',
})

const App: FunctionComponent = () => (
  <Container>
    <Notifier />
    <AppBar />
    <InformationPanel />
    <MapContainer />
    <BottomDrawer />
  </Container>
)

export default App

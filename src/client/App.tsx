import React, { FunctionComponent } from 'react'
import Hidden from '@material-ui/core/Hidden'
import { styled } from '@material-ui/core/styles'
import AppBar from './Appbar/Appbar'
import MapContainer from './Map/MapContainer'
import Notifier from './Notifier/Notifier'
import BottomDrawer from './InformationPanel/BottomDrawer'
import InformationPanel from './InformationPanel/InformationPanel'

const Container = styled('div')({
  display: 'flex',
  'flex-direction': 'column',
  position: 'relative',
  height: '100vh',
})

const App: FunctionComponent = () => (
  <Container>
    <Notifier />
    <AppBar />
    <Hidden xsDown>
      <InformationPanel />
    </Hidden>
    <MapContainer />
    <Hidden smUp>
      <BottomDrawer />
    </Hidden>
  </Container>
)

export default App

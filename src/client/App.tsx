import React, { Component } from 'react'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import Map from './Map/Map'

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
})

class App extends Component {
  render(): React.ReactElement {
    return (
      <MuiThemeProvider theme={theme}>
        <Map />
      </MuiThemeProvider>
    )
  }
}

export default App

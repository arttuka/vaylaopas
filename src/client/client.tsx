import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack'
import CssBaseline from '@mui/material/CssBaseline'
import StyledEngineProvider from '@mui/material/StyledEngineProvider'
import App from './App'
import store from './redux/store'

const WrappedApp = () => (
  <Provider store={store}>
    <StyledEngineProvider injectFirst>
      <SnackbarProvider>
        <CssBaseline />
        <App />
      </SnackbarProvider>
    </StyledEngineProvider>
  </Provider>
)

ReactDOM.render(<WrappedApp />, document.getElementById('root'))

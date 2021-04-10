import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack'
import CssBaseline from '@material-ui/core/CssBaseline'
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider'
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

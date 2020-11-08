import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack'
import CssBaseline from '@material-ui/core/CssBaseline'
import App from './App'
import store from './redux/store'

const WrappedApp = () => (
  <Provider store={store}>
    <SnackbarProvider>
      <CssBaseline />
      <App />
    </SnackbarProvider>
  </Provider>
)

ReactDOM.render(<WrappedApp />, document.getElementById('root'))

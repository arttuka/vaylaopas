import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import store from './redux/store'

const WrappedApp = (
  <Provider store={store}>
    <App />
  </Provider>
)

ReactDOM.render(WrappedApp, document.getElementById('root'))

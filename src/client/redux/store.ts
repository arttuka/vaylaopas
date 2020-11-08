import { applyMiddleware, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { composeWithDevTools } from 'redux-devtools-extension'
import { rootReducer } from './reducers'
import { rootSaga } from './sagas'

const initStore = () => {
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(sagaMiddleware))
  )
  return {
    ...store,
    runSaga: sagaMiddleware.run(rootSaga),
  }
}

const store = initStore()

export default store

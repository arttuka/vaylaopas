import { all, call, fork, put, select, takeLatest } from 'redux-saga/effects'
import { routeSuccessAction } from './actions'
import { ActionType } from './action-types'
import { settingsSelector, waypointsSelector } from './selectors'
import { getRoutes } from '../api'
import { SagaIterator } from 'redux-saga'

function* getRouteSaga(): SagaIterator {
  const waypoints = yield select(waypointsSelector)
  const settings = yield select(settingsSelector)
  const routes = yield call(getRoutes, waypoints, settings)
  yield put(routeSuccessAction({ routes }))
}

export function* watchChanges(): SagaIterator {
  yield takeLatest(
    [
      ActionType.WaypointAdd,
      ActionType.WaypointRemove,
      ActionType.WaypointMove,
      ActionType.SettingsSet,
    ],
    getRouteSaga
  )
}

export function* rootSaga(): SagaIterator {
  yield all([fork(watchChanges)])
}

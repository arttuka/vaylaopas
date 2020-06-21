import { SagaIterator } from 'redux-saga'
import { all, call, fork, put, select, takeLatest } from 'redux-saga/effects'
import { routeSuccessAction } from './actions'
import { ActionType } from './action-types'
import { settingsSelector, waypointsSelector } from './selectors'
import { getRoutes } from '../api'
import { enrichRoutes } from '../../common/util'

function* getRouteSaga(): SagaIterator {
  const waypoints = yield select(waypointsSelector)
  if (waypoints.length > 1) {
    const settings = yield select(settingsSelector)
    const routes = yield call(getRoutes, waypoints, settings)
    yield put(routeSuccessAction({ routes: enrichRoutes(routes, settings) }))
  } else {
    yield put(routeSuccessAction({ routes: [] }))
  }
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

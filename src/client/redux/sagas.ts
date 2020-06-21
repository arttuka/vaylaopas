import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest,
  StrictEffect,
} from 'redux-saga/effects'
import { routeUpdateAction } from './actions'
import { ActionType, SettingsSetAction } from './action-types'
import {
  settingsSelector,
  waypointsSelector,
  routesSelector,
} from './selectors'
import { getRoutes } from '../api'
import { enrichRoutes, storeSetting } from '../../common/util'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type SagaGenerator = Generator<StrictEffect, void, any>

function* getRouteSaga(): SagaGenerator {
  const waypoints = yield select(waypointsSelector)
  if (waypoints.length > 1) {
    const settings = yield select(settingsSelector)
    const routes = yield call(getRoutes, waypoints, settings)
    yield put(routeUpdateAction({ routes: enrichRoutes(routes, settings) }))
  } else {
    yield put(routeUpdateAction({ routes: [] }))
  }
}

function* watchChanges(): SagaGenerator {
  yield takeLatest(
    [
      ActionType.WaypointAdd,
      ActionType.WaypointRemove,
      ActionType.WaypointMove,
    ],
    getRouteSaga
  )
}

function* updateSettingSaga(action: SettingsSetAction): SagaGenerator {
  const { key, value } = action.data
  yield call(storeSetting, key, value)
  if (key === 'depth' || key === 'height') {
    yield* getRouteSaga()
  } else {
    const routes = yield select(routesSelector)
    const settings = yield select(settingsSelector)
    if (routes.length) {
      yield put(routeUpdateAction({ routes: enrichRoutes(routes, settings) }))
    }
  }
}

function* watchUpdateSettings(): SagaGenerator {
  yield takeEvery([ActionType.SettingsSet], updateSettingSaga)
}

export function* rootSaga(): SagaGenerator {
  yield all([fork(watchChanges), fork(watchUpdateSettings)])
}

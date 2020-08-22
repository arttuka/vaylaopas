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
import { notificationEnqueueAction, routeUpdateAction } from './actions'
import { ActionType, SettingsSetAction } from './action-types'
import {
  settingsSelector,
  waypointsSelector,
  routesSelector,
} from './selectors'
import { getRoutes } from '../api'
import { Route } from '../../common/types'
import { enrichRoutes, storeSetting } from '../../common/util'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type SagaGenerator = Generator<StrictEffect, void, any>

function* getRouteSaga(): SagaGenerator {
  const waypoints = yield select(waypointsSelector)
  if (waypoints.length > 1) {
    const settings = yield select(settingsSelector)
    try {
      const routes: Route[] = yield call(getRoutes, waypoints, settings)
      if (routes.some((route) => !route.found)) {
        yield put(
          notificationEnqueueAction({
            message: 'Reittiä ei löytynyt',
            variant: 'warning',
          })
        )
      }
      yield put(routeUpdateAction({ routes: enrichRoutes(routes, settings) }))
    } catch (err) {
      yield put(
        notificationEnqueueAction({
          message: 'Reitinhaussa tapahtui odottamaton virhe',
          variant: 'error',
        })
      )
      yield put(routeUpdateAction({ routes: [] }))
    }
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

import { combineReducers, Reducer } from 'redux'
import {
  ActionType,
  WaypointAction,
  RouteAction,
  SettingsSetAction,
} from './action-types'
import { Waypoints, RootState, Routes, Settings } from '../../common/types'
import {
  getStoredSetting,
  insertIndex,
  removeWhere,
  updateWhere,
  hasId,
  hasAnyId,
} from '../../common/util'

let waypointId = 0
const getId = (): string => `waypoint-${waypointId++}`
const getAdjacentWaypointIds = (waypoints: Waypoints, id: string): string[] => {
  const idx = waypoints.findIndex(hasId(id))
  const result = [id]
  let i = idx + 1
  while (i < waypoints.length && waypoints[i].type === 'waypoint') {
    result.push(waypoints[i].id)
    i++
  }
  i = idx - 1
  while (i >= 0 && waypoints[i].type === 'waypoint') {
    result.push(waypoints[i].id)
    i--
  }
  return result
}

const waypointReducer = (
  waypoints: Waypoints,
  action: WaypointAction
): Waypoints => {
  switch (action.type) {
    case ActionType.WaypointAdd: {
      const { point, index, type } = action.data
      return insertIndex(
        waypoints,
        index !== undefined ? index : waypoints.length,
        { ...point, id: getId(), type }
      )
    }
    case ActionType.WaypointRemove:
      const ids = getAdjacentWaypointIds(waypoints, action.data.id)
      return removeWhere(waypoints, hasAnyId(ids))
    case ActionType.WaypointMove: {
      const { point, id } = action.data
      return updateWhere(waypoints, hasId(id), point)
    }
    default:
      return waypoints
  }
}

const routeReducer = (routes: Routes, action: RouteAction): Routes => {
  switch (action.type) {
    case ActionType.RouteSuccess:
      return action.data.routes
    default:
      return routes
  }
}

const settingsReducer = (
  settings: Settings,
  action: SettingsSetAction
): Settings => {
  switch (action.type) {
    case ActionType.SettingsSet:
      const { key, value } = action.data
      return {
        ...settings,
        [key]: value,
      }
    default:
      return settings
  }
}

const defaultInitialState: RootState = {
  routes: [],
  settings: {
    height: getStoredSetting('height'),
    depth: getStoredSetting('depth'),
    speed: getStoredSetting('speed'),
    consumption: getStoredSetting('consumption'),
  },
  waypoints: [],
}

export const rootReducer = (initialState = defaultInitialState): Reducer =>
  combineReducers({
    waypoints: (state = initialState.waypoints, action) =>
      waypointReducer(state, action),
    routes: (state = initialState.routes, action) =>
      routeReducer(state, action),
    settings: (state = initialState.settings, action) =>
      settingsReducer(state, action),
  })

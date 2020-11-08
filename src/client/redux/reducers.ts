import { combineReducers, Reducer as ReduxReducer } from 'redux'
import {
  Reducer,
  WaypointActionType,
  RouteActionType,
  SettingsActionType,
  NotificationActionType,
  WaypointAction,
  RouteAction,
  NotificationAction,
  SettingsAction,
  Action,
} from './action-types'
import { Waypoint, RootState } from '../../common/types'
import {
  getStoredSetting,
  insertIndex,
  removeWhere,
  updateWhere,
  hasId,
  hasAnyId,
  makeIdGenerator,
} from '../../common/util'

const initialState: RootState = {
  routes: [],
  settings: {
    height: getStoredSetting('height'),
    depth: getStoredSetting('depth'),
    speed: getStoredSetting('speed'),
    consumption: getStoredSetting('consumption'),
  },
  waypoints: [],
  notifications: [],
}

const getAdjacentWaypointIds = (
  waypoints: Waypoint[],
  id: string
): string[] => {
  const idx = waypoints.findIndex(hasId(id))
  if (waypoints[idx].type === 'waypoint') {
    return [id]
  }
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

const generateWaypointId = makeIdGenerator('waypoint')
export const waypointReducer: Reducer<WaypointAction> = (
  waypoints = initialState.waypoints,
  action
) => {
  switch (action.type) {
    case WaypointActionType.WaypointAdd: {
      const { point, index, type } = action.data
      return insertIndex(
        waypoints,
        index !== undefined ? index : waypoints.length,
        { ...point, id: generateWaypointId(), type }
      )
    }
    case WaypointActionType.WaypointChange:
      const { id, type } = action.data
      return updateWhere(waypoints, hasId(id), { type })
    case WaypointActionType.WaypointRemove:
      const ids = getAdjacentWaypointIds(waypoints, action.data.id)
      return removeWhere(waypoints, hasAnyId(ids))
    case WaypointActionType.WaypointMove: {
      const { point, id } = action.data
      return updateWhere(waypoints, hasId(id), point)
    }
    default:
      return waypoints
  }
}

const routeReducer: Reducer<RouteAction> = (
  routes = initialState.routes,
  action
) => {
  switch (action.type) {
    case RouteActionType.RouteSuccess:
      return action.data.routes
    default:
      return routes
  }
}

const settingsReducer: Reducer<SettingsAction> = (
  settings = initialState.settings,
  action
) => {
  switch (action.type) {
    case SettingsActionType.SettingsSet:
      const { key, value } = action.data
      return {
        ...settings,
        [key]: value,
      }
    default:
      return settings
  }
}

const generateKey = makeIdGenerator('notification')
const notificationReducer: Reducer<NotificationAction> = (
  notifications = initialState.notifications,
  action
) => {
  switch (action.type) {
    case NotificationActionType.NotificationEnqueue:
      const { key, message, variant } = action.data
      return [
        ...notifications,
        {
          key: key || generateKey(),
          message,
          variant,
        },
      ]
    case NotificationActionType.NotificationRemove:
      return notifications.filter((n) => n.key !== action.data.key)
    default:
      return notifications
  }
}

export const rootReducer: ReduxReducer<RootState, Action> = combineReducers({
  waypoints: waypointReducer,
  routes: routeReducer,
  settings: settingsReducer,
  notifications: notificationReducer,
})

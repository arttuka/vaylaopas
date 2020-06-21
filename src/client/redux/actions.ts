import {
  ActionType,
  Action,
  WaypointAddProps,
  WaypointRemoveProps,
  WaypointMoveProps,
  RouteSuccessProps,
  SettingsSetProps,
} from './action-types'

export const waypointAddAction = (data: WaypointAddProps): Action => ({
  type: ActionType.WaypointAdd,
  data,
})

export const waypointRemoveAction = (data: WaypointRemoveProps): Action => ({
  type: ActionType.WaypointRemove,
  data,
})

export const waypointMoveAction = (data: WaypointMoveProps): Action => ({
  type: ActionType.WaypointMove,
  data,
})

export const routeSuccessAction = (data: RouteSuccessProps): Action => ({
  type: ActionType.RouteSuccess,
  data,
})

export const settingsSetAction = (data: SettingsSetProps): Action => ({
  type: ActionType.SettingsSet,
  data,
})

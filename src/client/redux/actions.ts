import {
  ActionType,
  Action,
  WaypointAddProps,
  WaypointRemoveProps,
  WaypointMoveProps,
  RouteUpdateProps,
  SettingsSetProps,
  NotificationEnqueueProps,
  NotificationRemoveProps,
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

export const routeUpdateAction = (data: RouteUpdateProps): Action => ({
  type: ActionType.RouteSuccess,
  data,
})

export const settingsSetAction = (data: SettingsSetProps): Action => ({
  type: ActionType.SettingsSet,
  data,
})

export const notificationEnqueueAction = (
  data: NotificationEnqueueProps
): Action => ({
  type: ActionType.NotificationEnqueue,
  data,
})

export const notificationRemoveAction = (
  data: NotificationRemoveProps
): Action => ({
  type: ActionType.NotificationRemove,
  data,
})

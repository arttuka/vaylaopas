import {
  ActionType,
  WaypointAddAction,
  WaypointAddProps,
  WaypointRemoveAction,
  WaypointRemoveProps,
  WaypointMoveAction,
  WaypointMoveProps,
  RouteUpdateAction,
  RouteUpdateProps,
  SettingsSetAction,
  SettingsSetProps,
  NotificationEnqueueAction,
  NotificationEnqueueProps,
  NotificationRemoveAction,
  NotificationRemoveProps,
} from './action-types'

export const waypointAddAction = (
  data: WaypointAddProps
): WaypointAddAction => ({
  type: ActionType.WaypointAdd,
  data,
})

export const waypointRemoveAction = (
  data: WaypointRemoveProps
): WaypointRemoveAction => ({
  type: ActionType.WaypointRemove,
  data,
})

export const waypointMoveAction = (
  data: WaypointMoveProps
): WaypointMoveAction => ({
  type: ActionType.WaypointMove,
  data,
})

export const routeUpdateAction = (
  data: RouteUpdateProps
): RouteUpdateAction => ({
  type: ActionType.RouteSuccess,
  data,
})

export const settingsSetAction = (
  data: SettingsSetProps
): SettingsSetAction => ({
  type: ActionType.SettingsSet,
  data,
})

export const notificationEnqueueAction = (
  data: NotificationEnqueueProps
): NotificationEnqueueAction => ({
  type: ActionType.NotificationEnqueue,
  data,
})

export const notificationRemoveAction = (
  data: NotificationRemoveProps
): NotificationRemoveAction => ({
  type: ActionType.NotificationRemove,
  data,
})

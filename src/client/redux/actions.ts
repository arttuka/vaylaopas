import {
  ActionCreator,
  WaypointActionType,
  RouteActionType,
  SettingsActionType,
  NotificationActionType,
  WaypointAddAction,
  WaypointChangeAction,
  WaypointRemoveAction,
  WaypointMoveAction,
  RouteUpdateAction,
  SettingsSetAction,
  NotificationEnqueueAction,
  NotificationRemoveAction,
} from './action-types'

export const waypointAddAction: ActionCreator<WaypointAddAction> = (data) => ({
  type: WaypointActionType.WaypointAdd,
  data,
})

export const waypointChangeAction: ActionCreator<WaypointChangeAction> = (
  data
) => ({
  type: WaypointActionType.WaypointChange,
  data,
})

export const waypointRemoveAction: ActionCreator<WaypointRemoveAction> = (
  data
) => ({
  type: WaypointActionType.WaypointRemove,
  data,
})

export const waypointMoveAction: ActionCreator<WaypointMoveAction> = (
  data
) => ({
  type: WaypointActionType.WaypointMove,
  data,
})

export const routeUpdateAction: ActionCreator<RouteUpdateAction> = (data) => ({
  type: RouteActionType.RouteSuccess,
  data,
})

export const settingsSetAction: ActionCreator<SettingsSetAction> = (data) => ({
  type: SettingsActionType.SettingsSet,
  data,
})

export const notificationEnqueueAction: ActionCreator<NotificationEnqueueAction> =
  (data) => ({
    type: NotificationActionType.NotificationEnqueue,
    data,
  })

export const notificationRemoveAction: ActionCreator<NotificationRemoveAction> =
  (data) => ({
    type: NotificationActionType.NotificationRemove,
    data,
  })

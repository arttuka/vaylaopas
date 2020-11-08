import { VariantType } from 'notistack'
import { Key, LngLat, Route, Settings, WaypointType } from '../../common/types'

export enum ActionType {
  WaypointAdd = 'WAYPOINT_ADD',
  WaypointChange = 'WAYPOINT_CHANGE',
  WaypointRemove = 'WAYPOINT_REMOVE',
  WaypointMove = 'WAYPOINT_MOVE',
  RouteSuccess = 'ROUTE_SUCCESS',
  SettingsSet = 'SETTINGS_SET',
  NotificationEnqueue = 'NOTIFICATION_ENQUEUE',
  NotificationRemove = 'NOTIFICATION_REMOVE',
}

export interface WaypointAddProps {
  point: LngLat
  index?: number
  type: WaypointType
}
export interface WaypointAddAction {
  type: ActionType.WaypointAdd
  data: WaypointAddProps
}

export interface WaypointChangeProps {
  id: string
  type: WaypointType
}

export interface WaypointChangeAction {
  type: ActionType.WaypointChange
  data: WaypointChangeProps
}

export interface WaypointRemoveProps {
  id: string
}
export interface WaypointRemoveAction {
  type: ActionType.WaypointRemove
  data: WaypointRemoveProps
}

export interface WaypointMoveProps {
  point: LngLat
  id: string
}
export interface WaypointMoveAction {
  type: ActionType.WaypointMove
  data: WaypointMoveProps
}

export type WaypointAction =
  | WaypointAddAction
  | WaypointChangeAction
  | WaypointRemoveAction
  | WaypointMoveAction

export interface RouteUpdateProps {
  routes: Route[]
}
export interface RouteUpdateAction {
  type: ActionType.RouteSuccess
  data: RouteUpdateProps
}

export type RouteAction = RouteUpdateAction

export interface SettingsSetProps {
  key: keyof Settings
  value?: number
}
export interface SettingsSetAction {
  type: ActionType.SettingsSet
  data: SettingsSetProps
}

export interface NotificationEnqueueProps {
  key?: Key
  message: string
  variant: VariantType
}

export interface NotificationEnqueueAction {
  type: ActionType.NotificationEnqueue
  data: NotificationEnqueueProps
}

export interface NotificationRemoveProps {
  key: Key
}

export interface NotificationRemoveAction {
  type: ActionType.NotificationRemove
  data: NotificationRemoveProps
}

export type NotificationAction =
  | NotificationEnqueueAction
  | NotificationRemoveAction

export type Action =
  | WaypointAction
  | RouteAction
  | SettingsSetAction
  | NotificationAction

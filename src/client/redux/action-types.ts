import { VariantType } from 'notistack'
import { Action as ReduxAction, Reducer as ReduxReducer } from 'redux'
import {
  Key,
  LngLat,
  RootState,
  Route,
  Settings,
  WaypointType,
} from '../../common/types'

export enum WaypointActionType {
  WaypointAdd = 'WAYPOINT_ADD',
  WaypointChange = 'WAYPOINT_CHANGE',
  WaypointRemove = 'WAYPOINT_REMOVE',
  WaypointMove = 'WAYPOINT_MOVE',
}

export enum RouteActionType {
  RouteSuccess = 'ROUTE_SUCCESS',
}

export enum SettingsActionType {
  SettingsSet = 'SETTINGS_SET',
}

export enum NotificationActionType {
  NotificationEnqueue = 'NOTIFICATION_ENQUEUE',
  NotificationRemove = 'NOTIFICATION_REMOVE',
}

export type ActionType =
  | WaypointActionType
  | RouteActionType
  | SettingsActionType
  | NotificationActionType

export type ActionMap = {
  waypoints: WaypointAction
  routes: RouteAction
  settings: SettingsAction
  notifications: NotificationAction
}

export type KeyFromActionType<T extends ActionType> = {
  [K in keyof ActionMap]: T extends ActionMap[K]['type'] ? K : never
}[keyof ActionMap]

export type StateFromActionType<T extends ActionType> =
  RootState[KeyFromActionType<T>]

export type BaseAction<T extends ActionType, D> = ReduxAction<T> & {
  type: T
  data: D
}

export type WaypointAddProps = {
  point: LngLat
  index?: number
  type: WaypointType
}
export type WaypointAddAction = BaseAction<
  WaypointActionType.WaypointAdd,
  WaypointAddProps
>

export type WaypointChangeProps = {
  id: string
  type: WaypointType
}
export type WaypointChangeAction = BaseAction<
  WaypointActionType.WaypointChange,
  WaypointChangeProps
>

export type WaypointRemoveProps = {
  id: string
}
export type WaypointRemoveAction = BaseAction<
  WaypointActionType.WaypointRemove,
  WaypointRemoveProps
>

export type WaypointMoveProps = {
  point: LngLat
  id: string
}
export type WaypointMoveAction = BaseAction<
  WaypointActionType.WaypointMove,
  WaypointMoveProps
>

export type WaypointAction =
  | WaypointAddAction
  | WaypointChangeAction
  | WaypointRemoveAction
  | WaypointMoveAction

export type RouteUpdateProps = {
  routes: Route[]
}
export type RouteUpdateAction = BaseAction<
  RouteActionType.RouteSuccess,
  RouteUpdateProps
>

export type RouteAction = RouteUpdateAction

export type SettingsSetProps = {
  key: keyof Settings
  value?: number
}
export type SettingsSetAction = BaseAction<
  SettingsActionType.SettingsSet,
  SettingsSetProps
>

export type SettingsAction = SettingsSetAction

export type NotificationEnqueueProps = {
  key?: Key
  message: string
  variant: VariantType
}
export type NotificationEnqueueAction = BaseAction<
  NotificationActionType.NotificationEnqueue,
  NotificationEnqueueProps
>

export type NotificationRemoveProps = {
  key: Key
}
export type NotificationRemoveAction = BaseAction<
  NotificationActionType.NotificationRemove,
  NotificationRemoveProps
>

export type NotificationAction =
  | NotificationEnqueueAction
  | NotificationRemoveAction

export type Action =
  | WaypointAction
  | RouteAction
  | SettingsAction
  | NotificationAction

export type ActionCreator<A extends Action> = (data: A['data']) => A

export type Reducer<A extends Action> = ReduxReducer<
  StateFromActionType<A['type']>,
  A
>

import { LngLat, Route, Settings } from '../../common/types'

export enum ActionType {
  WaypointAdd = 'WAYPOINT_ADD',
  WaypointRemove = 'WAYPOINT_REMOVE',
  WaypointMove = 'WAYPOINT_MOVE',
  RouteSuccess = 'ROUTE_SUCCESS',
  SettingsSet = 'SETTINGS_SET',
}

export interface WaypointAddProps {
  point: LngLat
  index?: number
}
export interface WaypointAddAction {
  type: ActionType.WaypointAdd
  data: WaypointAddProps
}

export interface WaypointRemoveProps {
  index: number
}
export interface WaypointRemoveAction {
  type: ActionType.WaypointRemove
  data: WaypointRemoveProps
}

export interface WaypointMoveProps {
  point: LngLat
  index: number
}
export interface WaypointMoveAction {
  type: ActionType.WaypointMove
  data: WaypointMoveProps
}

export type WaypointAction =
  | WaypointAddAction
  | WaypointRemoveAction
  | WaypointMoveAction

export interface RouteSuccessProps {
  routes: Route[]
}
export interface RouteSuccessAction {
  type: ActionType.RouteSuccess
  data: RouteSuccessProps
}

export type RouteAction = RouteSuccessAction

export interface SettingsSetProps {
  key: keyof Settings
  value?: number
}
export interface SettingsSetAction {
  type: ActionType.SettingsSet
  data: SettingsSetProps
}

export type Action = WaypointAction | RouteAction | SettingsSetAction

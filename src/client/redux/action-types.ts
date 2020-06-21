import { LngLat, Routes, Settings, WaypointType } from '../../common/types'

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
  type: WaypointType
}
export interface WaypointAddAction {
  type: ActionType.WaypointAdd
  data: WaypointAddProps
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
  | WaypointRemoveAction
  | WaypointMoveAction

export interface RouteUpdateProps {
  routes: Routes
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

export type Action = WaypointAction | RouteAction | SettingsSetAction

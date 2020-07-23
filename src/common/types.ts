import { Feature, Point, LineString, FeatureCollection } from 'geojson'
import { Dispatch, SetStateAction } from 'react'
import { Store } from 'redux'
import { Task } from 'redux-saga'
import { VariantType } from 'notistack'

export interface LngLat {
  lng: number
  lat: number
}

export type WaypointType = 'destination' | 'waypoint'

export interface Waypoint extends LngLat {
  id: string
  type: WaypointType
}

export interface LaneProperties {
  route: number
}

export type Lane = Feature<LineString, LaneProperties>

export const featureIsLane = (feature?: Feature): feature is Lane =>
  feature !== undefined &&
  feature.properties !== null &&
  feature.properties.hasOwnProperty('route')

export type LaneCollection = FeatureCollection<LineString, LaneProperties>

export interface WaypointProperties {
  id: string
  letter?: string
  type: WaypointType
}

export type WaypointFeature = Feature<Point, WaypointProperties>

export const featureIsWaypoint = (
  feature?: Feature
): feature is WaypointFeature =>
  feature !== undefined &&
  feature.properties !== null &&
  feature.properties.hasOwnProperty('id')

export type WaypointCollection = FeatureCollection<Point, WaypointProperties>

export interface Route {
  route: Lane[]
  startAndEnd: Lane[]
  length: number
  duration?: number
  fuel?: number
  type?: WaypointType
}

export interface Index<T> {
  [key: number]: T
}

export interface Settings {
  height?: number
  depth?: number
  speed?: number
  consumption?: number
}

export interface ClientConfig {
  mapserver: string
}

export interface ServerConfig {
  host: string
  port: number
  devserverPort?: number
}

export interface Config {
  client: ClientConfig
  db: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  server: ServerConfig
}

export type Waypoints = Waypoint[]

export type Routes = Route[]

export type Key = string | number

export interface Notification {
  key: Key
  message: string
  variant: VariantType
}

export interface RootState {
  routes: Routes
  settings: Settings
  waypoints: Waypoints
  notifications: Notification[]
}

export type SagaStore = Store<RootState> & {
  runSaga: Task
}

export type SetState<T> = Dispatch<SetStateAction<T>>

export interface MenuState {
  open: boolean
  top: number
  left: number
}

export interface TouchMarkerState {
  direction: 'up' | 'down'
  top: number
  left: number
}

export class RouteNotFoundError extends Error {}

import { Feature, Point, LineString } from 'geojson'
import { VariantType } from 'notistack'

export type Pred<T> = (t: T) => boolean

export interface Id {
  id: string
}

export interface LngLat {
  lng: number
  lat: number
}

export type WaypointType = 'destination' | 'waypoint'

export interface Waypoint extends LngLat, Id {
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

export interface WaypointProperties extends Id {
  letter?: string
  type: WaypointType
  dragged: boolean
}

export type WaypointFeature = Feature<Point, WaypointProperties>

export const featureIsWaypoint = (
  feature?: Feature
): feature is WaypointFeature =>
  feature !== undefined &&
  feature.properties !== null &&
  feature.properties.hasOwnProperty('id')

export interface RouteProps {
  found: boolean
  length?: number
  duration?: number
  fuel?: number
}

export interface Route extends RouteProps {
  route: Lane
  startAndEnd: Lane[]
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
  bundle: string
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

export type Key = string | number

export interface Notification {
  key: Key
  message: string
  variant: VariantType
}

export interface RootState {
  routes: Route[]
  settings: Settings
  waypoints: Waypoint[]
  notifications: Notification[]
}

export interface MenuState {
  open: boolean
  top: number
  left: number
  waypoint?: string
  isDestination?: boolean
}

export interface TouchMarkerState {
  direction: 'up' | 'down'
  top: number
  left: number
}

export interface Stats {
  assetsByChunkName: {
    [key: string]: string[]
  }
}

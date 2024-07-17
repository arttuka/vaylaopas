import { Feature, FeatureCollection, MultiPoint, LineString } from 'geojson'
import { VariantType } from 'notistack'

export type Pred<T> = (t: T) => boolean

export type Id = {
  id: string
}

export type LngLat = {
  lng: number
  lat: number
}

export type Point = {
  x: number
  y: number
}

export type WaypointType = 'destination' | 'via'

export type Waypoint = LngLat &
  Id & {
    letter?: string
    type: WaypointType
  }

export type LaneProperties = {
  route: number
}
export type Lane = Feature<LineString, LaneProperties>
export type Collection<F extends FeatureType> = FeatureCollection<
  F['geometry'],
  F['properties']
>
export type WaypointProperties = Id & {
  letter?: string
  type: WaypointType
  dragged: boolean
}
export type DragIndicatorFeatureProperties = {
  dragged: boolean
}
export type PointFeature = Feature<MultiPoint, DragIndicatorFeatureProperties>
export type FeatureType = Lane | PointFeature
export type IsFeature<T extends FeatureType> = (
  feature?: Feature
) => feature is T

const featureHasProperty = (feature: Feature | undefined, p: string): boolean =>
  feature !== undefined &&
  feature.properties !== null &&
  feature.properties.hasOwnProperty(p)

export const featureIsLane = (feature?: Feature): feature is Lane =>
  featureHasProperty(feature, 'route')

export type RouteProps = {
  found: boolean
  length?: number
  duration?: number
  fuel?: number
}

export type Route = RouteProps & {
  route: Lane
  startAndEnd: Lane[]
  type?: WaypointType
}

export type Index<T> = {
  [key: number]: T
}

export type Settings = {
  height?: number
  depth?: number
  speed?: number
  consumption?: number
}

export type MapSettings = {
  zoom: number
  centerLng: number
  centerLat: number
}

export type ClientConfig = {
  mapserver: string
}

export type ServerConfig = {
  host: string
  port: number
  bundle: string
}

export type Config = {
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

export type Stats = {
  assetsByChunkName: {
    [key: string]: string[]
  }
}

export type Key = string | number

export type Notification = {
  key: Key
  message: string
  variant: VariantType
}

export type RootState = {
  routes: Route[]
  settings: Settings
  waypoints: Waypoint[]
  notifications: Notification[]
}

export type MenuState = {
  open: boolean
  top: number
  left: number
  waypoint?: string
  isDestination?: boolean
}

export type TouchMarkerState = {
  direction: 'up' | 'down'
  top: number
  left: number
}

export type MapBy<
  T extends { [key in K]: unknown },
  K extends string,
  V extends T[K],
> = Extract<T, { [key in K]: V }>

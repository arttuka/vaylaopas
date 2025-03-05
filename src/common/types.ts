import { Feature, FeatureCollection, MultiPoint, LineString } from 'geojson'
import { VariantType } from 'notistack'

export type Pred<T> = (t: T) => boolean

export type Id = { id: string }

export type LngLat = { lng: number; lat: number }

export type Point = { x: number; y: number }

export type WaypointType = 'destination' | 'via' | 'viadirect'

export type Waypoint = LngLat & Id & { letter?: string; type: WaypointType }

export type RouteType = 'regular' | 'outside'

export type RouteFeatureProperties = {
  routeIndex: number
  routeType: RouteType
}
export type RouteFeature = Feature<LineString, RouteFeatureProperties>
export type Collection<F extends FeatureType> = FeatureCollection<
  F['geometry'],
  F['properties']
>
export type WaypointProperties = Id & {
  letter?: string
  type: WaypointType
  dragged: boolean
}
export type DragIndicatorFeatureProperties = { dragged: boolean }
export type PointFeature = Feature<MultiPoint, DragIndicatorFeatureProperties>
export type LineStringFeature = Feature<LineString>
export type FeatureType = RouteFeature | PointFeature | LineStringFeature
export type IsFeature<T extends FeatureType> = (
  feature?: Feature
) => feature is T

const featureHasProperty = (feature: Feature | undefined, p: string): boolean =>
  feature !== undefined &&
  feature.properties !== null &&
  Object.hasOwn(feature.properties, p)

export const featureIsRouteFeature = (
  feature?: Feature
): feature is RouteFeature => featureHasProperty(feature, 'routeIndex')

export type RouteProps = {
  found: boolean
  length?: number
  duration?: number
  fuel?: number
}

export type Route = RouteProps & { geometry: RouteFeature; type?: WaypointType }

export type ApiRoutes = { routes: Route[]; waypointLines: LineStringFeature[] }

export type Index<T> = { [key: number]: T }

export type Settings = {
  height?: number
  depth?: number
  speed?: number
  consumption?: number
}

export type MapSettings = { zoom: number; centerLng: number; centerLat: number }

export type ClientConfig = { mapserver: string }

export type ServerConfig = { host: string; port: number; bundle: string }

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

export type Stats = { assetsByChunkName: { [key: string]: string[] } }

export type Key = string | number

export type Notification = { key: Key; message: string; variant: VariantType }

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
  waypointType?: WaypointType
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

export type NotEmptyArray<T> = [T, ...T[]]

import {
  Feature,
  FeatureCollection,
  LineString,
  MultiPoint,
  Point,
} from 'geojson'
import {
  AnySourceImpl,
  EventData,
  GeoJSONSource,
  MapboxGeoJSONFeature,
  MapMouseEvent,
  MapTouchEvent,
  Map as MapboxMap,
} from 'mapbox-gl'
import { LaneProperties, WaypointProperties } from '../../common/types'

export type MouseEvent = MapMouseEvent & EventData
export type TouchEvent = MapTouchEvent & EventData
export type Event = MouseEvent | TouchEvent

export type MouseEventHandler = (e: MouseEvent) => void
export type TouchEventHandler = (e: TouchEvent) => void
export type DragStartHandler = (
  e: Event,
  feature: MapboxGeoJSONFeature,
  type: 'mouse' | 'touch'
) => {
  onMove: (e: Event) => void
  onMoveEnd: (e: Event) => void
}

export type LaneFeatureCollection = FeatureCollection<
  LineString,
  LaneProperties
>
export type WaypointFeatureCollection = FeatureCollection<
  Point,
  WaypointProperties
>
export type PointFeature = Feature<MultiPoint>

export interface RouteSource {
  id: 'route'
  data: LaneFeatureCollection
}

export interface NotFoundRouteSource {
  id: 'notFoundRoute'
  data: LaneFeatureCollection
}

export interface RouteStartAndEndSource {
  id: 'routeStartAndEnd'
  data: LaneFeatureCollection
}

export interface DragIndicatorSource {
  id: 'dragIndicator'
  data: PointFeature
}

export interface WaypointSource {
  id: 'waypoint'
  data: WaypointFeatureCollection
}

export type Source =
  | RouteSource
  | NotFoundRouteSource
  | RouteStartAndEndSource
  | DragIndicatorSource
  | WaypointSource

export type SourceId = Source['id']

export const sourceIsGeoJSON = (
  source?: AnySourceImpl
): source is GeoJSONSource => source !== undefined && source.type === 'geojson'

export interface Map extends MapboxMap {
  initialized: boolean
}

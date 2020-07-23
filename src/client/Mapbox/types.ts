import {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
  LineString,
  MultiPoint,
  Point,
} from 'geojson'
import {
  AnySourceImpl,
  EventData,
  GeoJSONSource,
  Map,
  MapboxGeoJSONFeature,
  MapMouseEvent,
  MapTouchEvent,
} from 'mapbox-gl'
import { LaneProperties, WaypointProperties } from '../../common/types'

export type MouseEvent = MapMouseEvent & EventData
export type TouchEvent = MapTouchEvent & EventData
export type Event = MouseEvent | TouchEvent

export type MouseEventHandler = (e: MouseEvent) => void
export type TouchEventHandler = (e: TouchEvent) => void
export type EventHandler = (e: Event) => void
export interface DragEventHandlers {
  onMove: EventHandler
  onMoveEnd: EventHandler
}
export type DragStartHandler = (
  map: Map,
  feature?: MapboxGeoJSONFeature
) => DragEventHandlers

export type GeoJSONFeature =
  | Feature<Geometry, GeoJsonProperties>
  | FeatureCollection<Geometry, GeoJsonProperties>

export type LaneFeatureCollection = FeatureCollection<
  LineString,
  LaneProperties
>
export type WaypointFeatureCollection = FeatureCollection<
  Point,
  WaypointProperties
>
export type PointFeature = Feature<MultiPoint, {}>

export interface RouteSource {
  id: 'route'
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
  | RouteStartAndEndSource
  | DragIndicatorSource
  | WaypointSource

export type SourceId = Source['id']

export type LayerId =
  | 'route'
  | 'routeStartAndEnd'
  | 'dragIndicator'
  | 'waypoint'
  | 'waypointText'

export const sourceIsGeoJSON = (
  source?: AnySourceImpl
): source is GeoJSONSource => source !== undefined && source.type === 'geojson'

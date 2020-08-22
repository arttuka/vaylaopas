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
} from 'mapbox-gl'
import { LaneProperties, WaypointProperties } from '../../common/types'

export type MouseEvent = MapMouseEvent & EventData
export type TouchEvent = MapTouchEvent & EventData
export type Event = MouseEvent | TouchEvent

export type MouseEventHandler = (e: MouseEvent) => void
export type TouchEventHandler = (e: TouchEvent) => void
export type DragStartHandler = (
  e: Event,
  feature: MapboxGeoJSONFeature
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

export interface RouteStartAndEndSource {
  id: 'routeStartAndEnd'
  data: LaneFeatureCollection
}

export interface DragIndicatorSource {
  id: 'dragIndicator'
  data: PointFeature
}

export interface LocationSource {
  id: 'location'
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
  | LocationSource
  | WaypointSource

export type SourceId = Source['id']

export const sourceIsGeoJSON = (
  source?: AnySourceImpl
): source is GeoJSONSource => source !== undefined && source.type === 'geojson'

import { Geometry, LineString, MultiPoint, Point } from 'geojson'
import {
  LayerSpecification,
  Source as MaplibreSource,
  GeoJSONSource,
  MapLayerMouseEvent,
  MapLayerTouchEvent,
} from 'maplibre-gl'
import {
  Collection,
  FeatureType,
  Lane,
  MapBy,
  PointFeature,
} from '../../common/types'

export type MouseEventHandler = (e: MapLayerMouseEvent) => void
export type TouchEventHandler = (
  e: MapLayerTouchEvent,
  shortTouch?: boolean
) => void
export type EventHandler<T extends EventType> = (e: EventTypes[T]) => void
export type DragStartHandler<F extends FeatureType> = <T extends EventType>(
  e: EventTypes[T],
  feature: F,
  type: T
) => {
  onMove: EventHandler<T>
  onMoveEnd: EventHandler<T>
}

export type EventTypes = {
  mouse: MapLayerMouseEvent
  touch: MapLayerTouchEvent
}
export type EventType = keyof EventTypes
export type Event = EventTypes[EventType]

type GetFeatureType<F extends FeatureType | Collection<FeatureType>> =
  F extends Collection<infer F2> ? F2 : F

export type SourceType<
  I extends string,
  F extends FeatureType | Collection<FeatureType>
> = {
  id: I
  data: F
}

export type AnySource =
  | SourceType<'route', Collection<Lane>>
  | SourceType<'notFoundRoute', Collection<Lane>>
  | SourceType<'routeStartAndEnd', Collection<Lane>>
  | SourceType<'dragIndicator', PointFeature>
export type SourceId = AnySource['id']
export type Source<S extends SourceId> = MapBy<AnySource, 'id', S>
export type SourceFeature<S extends SourceId> = GetFeatureType<
  Source<S>['data']
>
export type Sources = {
  [key in SourceId]: Source<key>
}

export const sourceIsGeoJSON = (
  source?: MaplibreSource
): source is GeoJSONSource => source !== undefined && source.type === 'geojson'

type LayerType<G extends Geometry> = G extends LineString
  ? 'line'
  : G extends Point
  ? 'symbol'
  : G extends MultiPoint
  ? 'symbol'
  : never
export type Layer<S extends SourceId> = MapBy<
  LayerSpecification,
  'type',
  LayerType<SourceFeature<S>['geometry']>
> & { id: S; source: S }

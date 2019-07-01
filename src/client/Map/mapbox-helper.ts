import { Feature, MultiPoint } from 'geojson'
import mapboxgl, {
  GeoJSONSource,
  GeoJSONSourceRaw,
  Layer,
  LinePaint,
  LngLat,
  Map,
} from 'mapbox-gl'
import { featureIsLane, Lane, LaneCollection, Route } from '../../common/types'

export type MouseEvent = mapboxgl.MapMouseEvent & mapboxgl.EventData
export type MouseLayerEvent = mapboxgl.MapLayerMouseEvent & mapboxgl.EventData
export type TouchEvent = mapboxgl.MapTouchEvent & mapboxgl.EventData

const laneCollection = (lanes: Lane[] = []): LaneCollection => ({
  type: 'FeatureCollection',
  features: lanes,
})

const pointFeature = (point?: LngLat): Feature<MultiPoint, {}> => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: point ? [[point.lng, point.lat]] : [],
  },
  properties: {},
})

const lineLayer = (data: {
  id: string
  source: string | GeoJSONSourceRaw
  paint: LinePaint
}): Layer => {
  const { id, source, paint } = data
  return {
    id,
    source,
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint,
  }
}

interface EventHandlers {
  handleClick: (e: MouseEvent) => void
  handleLongTouch: (e: TouchEvent) => void
  handleContextMenu: (e: MouseEvent) => void
  handleDragRoute: (e: MouseEvent, route: number) => void
  handleTouchStart: (e: TouchEvent) => void
  handleTouchEnd: () => void
}

export const initializeMap = (
  map: Map,
  eventHandlers: EventHandlers,
  longTouchDuration: number
): void => {
  const {
    handleClick,
    handleLongTouch,
    handleContextMenu,
    handleDragRoute,
    handleTouchStart,
    handleTouchEnd,
  } = eventHandlers
  const canvas = map.getCanvasContainer()
  const onMove = (e: MouseEvent): void => {
    const dragIndicatorSource = map.getSource('dragIndicator') as GeoJSONSource
    dragIndicatorSource.setData(pointFeature(e.lngLat))
  }
  const onUp = (e: MouseEvent, route: number): void => {
    map.off('mousemove', onMove)
    const dragIndicatorSource = map.getSource('dragIndicator') as GeoJSONSource
    dragIndicatorSource.setData(pointFeature())
    handleDragRoute(e, route)
  }
  let longTouchTimer = 0
  const onTouchEnd = (): void => {
    window.clearTimeout(longTouchTimer)
    handleTouchEnd()
  }
  map.touchZoomRotate.disableRotation()
  map.dragRotate.disable()
  map
    .addSource('route', {
      type: 'geojson',
      data: laneCollection(),
    })
    .addLayer(
      lineLayer({
        id: 'route',
        source: 'route',
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
        },
      })
    )
    .addSource('routeStartAndEnd', {
      type: 'geojson',
      data: laneCollection(),
    })
    .addLayer(
      lineLayer({
        id: 'routeStartAndEnd',
        source: 'routeStartAndEnd',
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
          'line-dasharray': [0.5, 3],
        },
      })
    )
    .addSource('dragIndicator', {
      type: 'geojson',
      data: pointFeature(),
    })
    .addLayer({
      id: 'dragIndicator',
      source: 'dragIndicator',
      type: 'circle',
      paint: {
        'circle-radius': 10,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000',
      },
    })
    .on('contextmenu', handleContextMenu)
    .on('click', handleClick)
    .on(
      'mouseenter',
      'route',
      (): void => {
        canvas.style.cursor = 'move'
      }
    )
    .on(
      'mouseleave',
      'route',
      (): void => {
        canvas.style.cursor = ''
      }
    )
    .on(
      'mousedown',
      'route',
      (e): void => {
        e.preventDefault()
        canvas.style.cursor = 'grab'
        const feature = e.features && e.features[0]
        if (featureIsLane(feature)) {
          map.on('mousemove', onMove)
          map.once(
            'mouseup',
            (e: MouseEvent): void => onUp(e, feature.properties.route)
          )
        }
      }
    )
    .on(
      'touchstart',
      (e): void => {
        window.clearTimeout(longTouchTimer)
        handleTouchStart(e)
        longTouchTimer = window.setTimeout((): void => {
          handleLongTouch(e)
        }, longTouchDuration)
      }
    )
    .on('touchend', onTouchEnd)
    .on('touchcancel', onTouchEnd)
    .on('touchmove', onTouchEnd)
}

export const updateRoute = (map: Map, routes: Route[]): void => {
  const startAndEndSource = map.getSource('routeStartAndEnd') as GeoJSONSource
  const routeSource = map.getSource('route') as GeoJSONSource
  if (routes.length) {
    const { route, startAndEnd } = routes.reduce(
      (acc, route): Route => ({
        route: acc.route.concat(route.route),
        startAndEnd: [...acc.startAndEnd, route.startAndEnd[1]],
        length: acc.length + route.length,
      }),
      { route: [], startAndEnd: [routes[0].startAndEnd[0]], length: 0 }
    )
    routeSource.setData(laneCollection(route))
    startAndEndSource.setData(laneCollection(startAndEnd))
  } else {
    routeSource.setData(laneCollection())
    startAndEndSource.setData(laneCollection())
  }
}

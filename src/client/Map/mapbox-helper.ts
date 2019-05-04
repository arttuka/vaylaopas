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

export const initializeMap = (
  map: Map,
  handleClick: (e: MouseEvent) => void,
  handleContextMenu: (e: MouseEvent) => void,
  handleDragRoute: (e: MouseEvent, route: number) => void
): void => {
  const canvas = map.getCanvasContainer()
  map.addSource('route', {
    type: 'geojson',
    data: laneCollection(),
  })
  map.addLayer(
    lineLayer({
      id: 'route',
      source: 'route',
      paint: {
        'line-color': '#ff0000',
        'line-width': 3,
      },
    })
  )
  map.addSource('routeStartAndEnd', {
    type: 'geojson',
    data: laneCollection(),
  })
  map.addLayer(
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
  map.addSource('dragIndicator', {
    type: 'geojson',
    data: pointFeature(),
  })
  map.addLayer({
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
  map.on('contextmenu', handleContextMenu)
  map.on('click', handleClick)
  map.on(
    'mouseenter',
    'route',
    (): void => {
      canvas.style.cursor = 'move'
    }
  )
  map.on(
    'mouseleave',
    'route',
    (): void => {
      canvas.style.cursor = ''
    }
  )
  const onMove = (e: MouseEvent): void => {
    const dragIndicatorSource = map.getSource('dragIndicator') as GeoJSONSource
    dragIndicatorSource.setData(pointFeature(e.lngLat))
  }
  const onUp = (route: number): ((e: MouseEvent) => void) => (
    e: MouseEvent
  ): void => {
    map.off('mousemove', onMove)
    const dragIndicatorSource = map.getSource('dragIndicator') as GeoJSONSource
    dragIndicatorSource.setData(pointFeature())
    handleDragRoute(e, route)
  }
  map.on(
    'mousedown',
    'route',
    (e): void => {
      e.preventDefault()
      canvas.style.cursor = 'grab'
      const feature = e.features && e.features[0]
      if (featureIsLane(feature)) {
        map.on('mousemove', onMove)
        map.once('mouseup', onUp(feature.properties.route))
      }
    }
  )
}

export const updateRoute = (map: Map, routes: Route[] = []): void => {
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

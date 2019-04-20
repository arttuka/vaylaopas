import { Feature, MultiPoint } from 'geojson'
import mapboxgl, {
  GeoJSONSource,
  GeoJSONSourceRaw,
  Layer,
  LinePaint,
  LngLat,
  Map,
} from 'mapbox-gl'
import { LaneCollection, Route } from '../common/lane'

export type ClickEvent = mapboxgl.MapMouseEvent & mapboxgl.EventData

export const notEmpty = <T>(t: T | undefined): t is T => t !== undefined

const multiPointFeature = (points: LngLat[] = []): Feature<MultiPoint, {}> => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: points.map((p): number[] => [p.lng, p.lat]),
  },
  properties: {},
})

const featureCollection: LaneCollection = {
  type: 'FeatureCollection',
  features: [],
}

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
  handleClick: (e: ClickEvent) => void,
  allLanes: LaneCollection
): void => {
  map.addLayer(
    lineLayer({
      id: 'allLanes',
      source: {
        type: 'geojson',
        data: allLanes,
      },
      paint: {
        'line-color': '#000000',
        'line-width': 1,
      },
    })
  )
  map.addSource('route', {
    type: 'geojson',
    data: featureCollection,
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
    data: featureCollection,
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
  map.addSource('routePoints', {
    type: 'geojson',
    data: multiPointFeature(),
  })
  map.addLayer({
    id: 'routePoints',
    type: 'circle',
    source: 'routePoints',
    paint: {
      'circle-radius': 5,
      'circle-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#000000',
    },
  })
  map.on('click', handleClick)
}

export const updateRoute = (map: Map, route?: Route): void => {
  const startAndEndSource = map.getSource('routeStartAndEnd') as GeoJSONSource
  const routeSource = map.getSource('route') as GeoJSONSource
  if (route) {
    routeSource.setData(route.route)
    startAndEndSource.setData(route.startAndEnd)
  } else {
    routeSource.setData(featureCollection)
    startAndEndSource.setData(featureCollection)
  }
}

export const updateRoutePoints = (map: Map, points: LngLat[]): void => {
  const source = map.getSource('routePoints') as GeoJSONSource
  source.setData(multiPointFeature(points))
}

import { LngLat, Map } from 'mapbox-gl'
import {
  LaneFeatureCollection,
  PointFeature,
  Source,
  WaypointFeatureCollection,
  sourceIsGeoJSON,
} from './types'
import { Lane, Route, Waypoint } from '../../common/types'
import { numToLetter } from '../../common/util'

export const laneFeatureCollection = (
  lanes: Lane[] = []
): LaneFeatureCollection => ({
  type: 'FeatureCollection',
  features: lanes,
})

export const waypointFeatureCollection = (
  waypoints: Waypoint[] = []
): WaypointFeatureCollection => {
  let i = 0
  return {
    type: 'FeatureCollection',
    features: waypoints.map(({ id, type, lng, lat }) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        id,
        letter: type === 'destination' ? numToLetter(i++) : undefined,
        type,
        dragged: false,
      },
    })),
  }
}

export const pointFeature = (point?: LngLat): PointFeature => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: point ? [[point.lng, point.lat]] : [],
  },
  properties: {},
})

export const generateRouteSources = (routes: Route[]): [Source, Source] => {
  const { route = [], startAndEnd = [] } = routes.length
    ? routes.reduce(
        (acc, route) => ({
          route: acc.route.concat(route.route),
          startAndEnd: [...acc.startAndEnd, route.startAndEnd[1]],
          length: acc.length + route.length,
        }),
        { route: [], startAndEnd: [routes[0].startAndEnd[0]], length: 0 }
      )
    : {}
  return [
    { id: 'route', data: laneFeatureCollection(route) },
    { id: 'routeStartAndEnd', data: laneFeatureCollection(startAndEnd) },
  ]
}

export const addSources = (map: Map, sources: Source[]): void => {
  sources.forEach(({ id, data }) =>
    map.addSource(id, { type: 'geojson', data })
  )
}

export const setSourceData = (map: Map, { id, data }: Source): void => {
  const source = map.getSource(id)
  if (sourceIsGeoJSON(source)) {
    source.setData(data)
  }
}

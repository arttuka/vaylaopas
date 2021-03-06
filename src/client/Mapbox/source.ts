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

const collectRoutes = (
  routes: Route[]
): { route: Lane[]; notFoundRoute: Lane[]; startAndEnd: Lane[] } => {
  return routes.length
    ? routes.reduce<{
        route: Lane[]
        notFoundRoute: Lane[]
        startAndEnd: Lane[]
      }>(
        (acc, route) => ({
          route: route.found ? acc.route.concat(route.route) : acc.route,
          startAndEnd: [...acc.startAndEnd, route.startAndEnd[1]],
          notFoundRoute: route.found
            ? acc.notFoundRoute
            : acc.notFoundRoute.concat(route.route),
        }),
        {
          route: [],
          notFoundRoute: [],
          startAndEnd: [routes[0].startAndEnd[0]],
        }
      )
    : { route: [], notFoundRoute: [], startAndEnd: [] }
}

export const generateRouteSources = (routes: Route[]): Source[] => {
  const { route, notFoundRoute, startAndEnd } = collectRoutes(routes)
  return [
    { id: 'route', data: laneFeatureCollection(route) },
    { id: 'notFoundRoute', data: laneFeatureCollection(notFoundRoute) },
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

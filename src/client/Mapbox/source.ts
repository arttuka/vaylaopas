import { LngLat, Map } from 'maplibre-gl'
import { SourceId, Source, Sources, sourceIsGeoJSON } from './types'
import {
  Collection,
  Lane,
  PointFeature,
  Route,
  Waypoint,
  WaypointFeature,
} from '../../common/types'
import { numToLetter } from '../../common/util'
import { useEffect, MutableRefObject } from 'react'

export const laneFeatureCollection = (
  lanes: Lane[] = []
): Collection<Lane> => ({
  type: 'FeatureCollection',
  features: lanes,
})

export const waypointFeatureCollection = (
  waypoints: Waypoint[] = []
): Collection<WaypointFeature> => {
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

export const pointFeature = (
  point?: LngLat,
  dragged = false
): PointFeature => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: point ? [[point.lng, point.lat]] : [],
  },
  properties: {
    dragged,
  },
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

export const generateRouteSources = (
  routes: Route[]
): Pick<Sources, 'route' | 'notFoundRoute' | 'routeStartAndEnd'> => {
  const { route, notFoundRoute, startAndEnd } = collectRoutes(routes)
  return {
    route: { id: 'route', data: laneFeatureCollection(route) },
    notFoundRoute: {
      id: 'notFoundRoute',
      data: laneFeatureCollection(notFoundRoute),
    },
    routeStartAndEnd: {
      id: 'routeStartAndEnd',
      data: laneFeatureCollection(startAndEnd),
    },
  }
}

export const addSources = (map: Map, sources: Sources): void => {
  for (const { id, data } of Object.values(sources)) {
    map.addSource(id, { type: 'geojson', data })
  }
}

export const setSourceData = <S extends SourceId>(
  map: Map,
  { id, data }: Source<S>
): void => {
  const source = map.getSource(id)
  if (sourceIsGeoJSON(source)) {
    source.setData(data)
  }
}

export const useSource = <S extends SourceId>(
  mapRef: MutableRefObject<Map | undefined>,
  source: Source<S>
): void => {
  useEffect(() => {
    if (mapRef.current) {
      setSourceData(mapRef.current, source)
    }
  }, [source])
}

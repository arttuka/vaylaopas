import { LngLat, Map } from 'maplibre-gl'
import {
  AnySource,
  LayerId,
  LayerProps,
  SourceId,
  Source,
  Sources,
  sourceIsGeoJSON,
} from './types'
import { Collection, Lane, PointFeature, Route } from '../../common/types'
import { useEffect } from 'react'
import { addLayer, removeLayer } from './layer'

export const laneFeatureCollection = (
  lanes: Lane[] = []
): Collection<Lane> => ({
  type: 'FeatureCollection',
  features: lanes,
})

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

export const addSource = (map: Map, { id, data }: AnySource): void => {
  map.addSource(id, { type: 'geojson', data })
}

export const removeSource = (map: Map, id: SourceId): void => {
  map.removeSource(id)
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

export const useSource = <S extends SourceId, L extends LayerId>(
  map: Map,
  source: Source<S>,
  layers: LayerProps<L>[]
): void => {
  useEffect(() => {
    addSource(map, source)
    for (const layer of layers) {
      addLayer(map, layer)
    }
    return () => {
      for (const layer of layers) {
        removeLayer(map, layer.layer.id)
      }
      removeSource(map, source.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    setSourceData(map, source)
  }, [map, source])
}

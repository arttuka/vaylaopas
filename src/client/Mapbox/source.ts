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
import {
  Collection,
  RouteFeature,
  PointFeature,
  Route,
  FeatureType,
} from '../../common/types'
import { useEffect } from 'react'
import { addLayer, removeLayer } from './layer'

export const featureCollection = <F extends FeatureType>(
  features: F[] = []
): Collection<F> => ({
  type: 'FeatureCollection',
  features,
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

type CollectedRoutes = {
  geometry: RouteFeature[]
  notFoundGeometry: RouteFeature[]
}

const collectRoutes = (routes: Route[]): CollectedRoutes =>
  routes.reduce<CollectedRoutes>(
    ({ geometry, notFoundGeometry }, r) => ({
      geometry: r.found ? [...geometry, r.geometry] : geometry,
      notFoundGeometry: r.found
        ? notFoundGeometry
        : [...notFoundGeometry, r.geometry],
    }),
    {
      geometry: [],
      notFoundGeometry: [],
    }
  )

export const generateRouteSources = (
  routes: Route[]
): Pick<Sources, 'route' | 'notFoundRoute'> => {
  const { geometry, notFoundGeometry } = collectRoutes(routes)
  return {
    route: { id: 'route', data: featureCollection(geometry) },
    notFoundRoute: {
      id: 'notFoundRoute',
      data: featureCollection(notFoundGeometry),
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

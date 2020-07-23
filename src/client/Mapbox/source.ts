import { LngLat, Map } from 'mapbox-gl'
import {
  LaneFeatureCollection,
  PointFeature,
  Source,
  WaypointFeatureCollection,
  sourceIsGeoJSON,
} from './types'
import { Lane, Waypoints } from '../../common/types'
import { numToLetter } from '../../common/util'

export const laneFeatureCollection = (
  lanes: Lane[] = []
): LaneFeatureCollection => ({
  type: 'FeatureCollection',
  features: lanes,
})

export const waypointFeatureCollection = (
  waypoints: Waypoints = []
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

const addSource = (map: Map, { id, data }: Source): void => {
  map.addSource(id, { type: 'geojson', data })
}

export const addSources = (map: Map): void => {
  addSource(map, { id: 'route', data: laneFeatureCollection() })
  addSource(map, { id: 'routeStartAndEnd', data: laneFeatureCollection() })
  addSource(map, { id: 'dragIndicator', data: pointFeature() })
  addSource(map, { id: 'waypoint', data: waypointFeatureCollection() })
}

export const setSourceData = (map: Map, { id, data }: Source): void => {
  const source = map.getSource(id)
  if (sourceIsGeoJSON(source)) {
    source.setData(data)
  }
}

import { Feature, LineString, FeatureCollection } from 'geojson'

export interface LngLat {
  lng: number
  lat: number
}

export interface LaneProperties {
  route: number
}

export type Lane = Feature<LineString, LaneProperties>

export const featureIsLane = (feature: Feature | undefined): feature is Lane =>
  feature !== undefined &&
  feature.properties !== null &&
  feature.properties.hasOwnProperty('route')

export type LaneCollection = FeatureCollection<LineString, LaneProperties>

export interface Route {
  route: Lane[]
  startAndEnd: Lane[]
  length: number
}

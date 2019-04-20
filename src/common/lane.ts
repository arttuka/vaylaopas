import { Feature, LineString, FeatureCollection, Point } from 'geojson'

export interface LngLat {
  lng: number
  lat: number
}

export interface RawLane {
  geometry: string
}

export interface LaneProperties {
  route: number
}

export type Lane = Feature<LineString, LaneProperties>

export const featureIsLane = (feature: Feature): feature is Lane =>
  feature.properties !== null && feature.properties.hasOwnProperty('route')

export type LaneCollection = FeatureCollection<LineString, LaneProperties>

export type Vertex = Feature<Point, {}>

export type VertexCollection = FeatureCollection<Point, {}>

export interface Route {
  route: Lane[]
  startAndEnd: Lane[]
  length: number
}

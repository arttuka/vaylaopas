import { Feature, LineString, FeatureCollection, Point } from 'geojson'

export interface LngLat {
  lng: number
  lat: number
}

export interface RawLane {
  geometry: string
}

export type Lane = Feature<LineString, {}>

export type LaneCollection = FeatureCollection<LineString, {}>

export type Vertex = Feature<Point, {}>

export type VertexCollection = FeatureCollection<Point, {}>

export interface Route {
  route: Lane[]
  startAndEnd: Lane[]
  length: number
}

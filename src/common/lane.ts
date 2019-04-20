import {
  Feature,
  LineString,
  MultiLineString,
  FeatureCollection,
  Point,
} from 'geojson'

export interface LaneProperties {
  gid: number
}

export type Lane = Feature<LineString | MultiLineString, LaneProperties>

export type LaneCollection = FeatureCollection<
  LineString | MultiLineString,
  LaneProperties
>

export type Vertex = Feature<Point, {}>

export type VertexCollection = FeatureCollection<Point, {}>

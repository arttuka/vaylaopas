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
  duration?: number
  fuel?: number
}

export interface Index<T> {
  [key: number]: T
}

export interface Settings {
  height?: number
  depth?: number
  speed?: number
  consumption?: number
}

export interface ClientConfig {
  mapserver: string
}

export interface Config {
  client: ClientConfig
  server: {
    port: number
  }
  db: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
}

import React, { Component } from 'react'
import axios from 'axios'
import { flatMap } from 'lodash'
import {
  Feature,
  LineString,
  FeatureCollection,
  MultiPoint,
  Position,
} from 'geojson'
import mapboxgl from 'mapbox-gl'
import styled from 'styled-components'
import { Lane, Intersection, Coordinate } from '../common/lane'

type LaneFeature = Feature<LineString, null>

type LanesFeature = FeatureCollection<LineString, null>

type IntersectionsFeature = Feature<MultiPoint, null>

const coordinateToPosition = (c: Coordinate): Position => [c.x, c.y]

const laneToFeature = (lane: Lane): LaneFeature => ({
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: lane.coordinates.map(coordinateToPosition),
  },
  properties: null,
})

const intersectionsToFeature = (
  intersections: Intersection[]
): IntersectionsFeature => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: intersections.map(coordinateToPosition),
  },
  properties: null,
})

const laneToEndpoints = (lane: Lane): Position[] => [
  coordinateToPosition(lane.coordinates[0]),
  coordinateToPosition(lane.coordinates[lane.coordinates.length - 1]),
]

const elementId = 'mapbox-container'

const Div = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
`

interface MapState {
  lanes?: LanesFeature
  intersections?: IntersectionsFeature
}

class Map extends Component<{}, MapState> {
  componentDidMount(): void {
    const map = new mapboxgl.Map({
      container: elementId,
      style: 'http://localhost:8000/styles/osm-bright/style.json',
      hash: true,
      zoom: 7,
      center: [24.94, 60.17],
    })
    map.on(
      'load',
      async (): Promise<void> => {
        let response = await axios.get('/api/lanes')
        const lanes: LanesFeature = {
          type: 'FeatureCollection',
          features: response.data.map(laneToFeature),
        }
        const endpoints: IntersectionsFeature = {
          type: 'Feature',
          geometry: {
            type: 'MultiPoint',
            coordinates: flatMap(response.data, laneToEndpoints),
          },
          properties: null,
        }
        response = await axios.get('/api/intersections')
        const intersections = intersectionsToFeature(response.data)
        this.setState({ lanes, intersections })
        map.addLayer({
          id: `vaylat`,
          type: 'line',
          source: {
            type: 'geojson',
            data: lanes,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#000000',
            'line-width': 1,
          },
        })
        map.addLayer({
          id: 'intersections',
          type: 'circle',
          source: {
            type: 'geojson',
            data: intersections,
          },
          paint: {
            'circle-radius': 5,
            'circle-color': '#00ff00',
          },
        })
        map.addLayer({
          id: 'endpoints',
          type: 'circle',
          source: {
            type: 'geojson',
            data: endpoints,
          },
          paint: {
            'circle-radius': 3,
            'circle-color': '#ff0000',
          },
        })
      }
    )
  }

  render(): React.ReactElement {
    return <Div id={elementId} />
  }
}

export default Map

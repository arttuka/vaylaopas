import React, { Component } from 'react'
import axios from 'axios'
import { Feature, Geometry, GeoJsonProperties, FeatureCollection, MultiPoint } from 'geojson'
import mapboxgl from 'mapbox-gl'
import styled from 'styled-components'

interface VaylaProperties {
  id: number
  name: string
  depth: number
}

interface Vayla extends Feature<Geometry, VaylaProperties> {
  type: 'Feature'
  geometry: Geometry
  properties: VaylaProperties
}

interface Vaylat extends FeatureCollection<Geometry, VaylaProperties> {
  type: 'FeatureCollection'
  features: Vayla[]
}

interface Intersections extends Feature<Geometry, null> {
  type: 'Feature'
  geometry: Geometry
  properties: null
}

const elementId = 'mapbox-container'

const Div = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
`

interface MapState {
  vaylat?: Vaylat
  intersections?: Intersections
}

class Map extends Component<{}, MapState> {
  constructor(props: {}) {
    super(props)
  }
  
  componentDidMount(): void {
    const map = new mapboxgl.Map({
      container: elementId,
      style: 'http://localhost:8000/styles/osm-bright/style.json',
      hash: true,
      zoom: 7,
      center: [24.94, 60.17]
    })
    map.on('load', async () => {
      let response = await axios.get('/api/vaylat')
      const vaylat: Vaylat = {
        type: 'FeatureCollection',
        features: response.data,
      }
      response = await axios.get('/api/intersections')
      const intersections: Intersections = {
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: response.data,
        },
        properties: null,
      }
      this.setState({ vaylat, intersections })
      map.addLayer({
        id: `vaylat`,
        type: 'line',
        source: {
          type: 'geojson',
          data: vaylat,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': "#000000",
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
          "circle-radius": 5,
          "circle-color": '#00ff00',
        }
      })
      console.log(vaylat.features.find(vayla => vayla.properties.id === 4950))
      console.log(vaylat.features.find(vayla => vayla.properties.id === 5010))
    })
  }

  render(): React.ReactElement {
    return (
      <Div id={elementId}>
      </Div>
    )
  }
}

export default Map

import React, { Component } from 'react'
import axios from 'axios'
import { Feature, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson'
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

const elementId = 'mapbox-container'

const Div = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
`

interface MapState {
  data: Vayla[]
}

class Map extends Component<{}, MapState> {
  constructor(props: MapState) {
    super(props)
    this.state = { data: [] }
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
      const response = await axios.get('/api/data')
      const vaylat: Vaylat = {
        type: 'FeatureCollection',
        features: response.data,
      }
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

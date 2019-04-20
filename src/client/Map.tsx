import React, { Component } from 'react'
import axios from 'axios'
import mapboxgl from 'mapbox-gl'
import styled from 'styled-components'
import { Lane, LaneCollection, VertexCollection } from '../common/lane'

const elementId = 'mapbox-container'

const Div = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
`

class Map extends Component<{}, {}> {
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
        const allLanes: LaneCollection = (await axios.get('/api/lane')).data
        const gaps: VertexCollection = (await axios.get('/api/vertex/gaps')).data
        map.addLayer({
          id: 'allLanes',
          type: 'line',
          source: {
            type: 'geojson',
            data: allLanes,
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
          id: 'gaps',
          type: 'circle',
          source: {
            type: 'geojson',
            data: gaps,
          },
          paint: {
            'circle-radius': 5,
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

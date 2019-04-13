import React, { Component } from 'react'
import mapboxgl from 'mapbox-gl'
import styled from 'styled-components'

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
      center: [24.94, 60.17]
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

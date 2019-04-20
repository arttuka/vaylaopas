import React, { Component } from 'react'
import axios from 'axios'
import mapboxgl, { LngLat } from 'mapbox-gl'
import styled from 'styled-components'
import {
  ClickEvent,
  initializeMap,
  notEmpty,
  updateRoute,
  updateRoutePoints,
} from './mapbox-helper'
import { LaneCollection, Route } from '../common/lane'

const elementId = 'mapbox-container'

const Div = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
`

interface MapState {
  from?: LngLat
  to?: LngLat
}

interface MapProps {}

class Map extends Component<MapProps, MapState> {
  map?: mapboxgl.Map = undefined

  constructor(props: MapProps) {
    super(props)
    this.state = {}
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount(): void {
    const map = new mapboxgl.Map({
      container: elementId,
      style: 'http://localhost:8000/styles/osm-bright/style.json',
      hash: true,
      zoom: 7,
      center: [24.94, 60.17],
    })
    this.map = map
    map.on(
      'load',
      async (): Promise<void> => {
        const allLanes: LaneCollection = (await axios.get('/api/lane')).data
        initializeMap(map, this.handleClick, allLanes)
      }
    )
  }

  async componentDidUpdate(): Promise<void> {
    const { from, to } = this.state
    if (this.map) {
      const routePoints = [from, to].filter(notEmpty)
      updateRoutePoints(this.map, routePoints)
      if (from && to) {
        const route: Route = (await axios.post('/api/route', {
          from,
          to,
        })).data
        updateRoute(this.map, route)
      } else {
        updateRoute(this.map)
      }
    }
  }

  handleClick(e: ClickEvent): void {
    const { lngLat } = e
    this.setState(
      (state): MapState =>
        state.to || !state.from
          ? { from: lngLat, to: undefined }
          : { to: lngLat }
    )
  }

  render(): React.ReactElement {
    return <Div id={elementId} />
  }
}

export default Map

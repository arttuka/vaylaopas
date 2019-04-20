import React, { Component } from 'react'
import axios from 'axios'
import mapboxgl, { LngLat } from 'mapbox-gl'
import styled from 'styled-components'
import ContextMenu from './ContextMenu'
import {
  ClickEvent,
  initializeMap,
  notEmpty,
  updateRoute,
  updateRoutePoints,
} from './mapbox-helper'
import { LaneCollection, Route } from '../../common/lane'
import { statement } from '@babel/template'

const elementId = 'mapbox-container'

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`

const MapContainer = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
`

interface MapState {
  lastClick: LngLat
  routePoints: LngLat[]
  menu: {
    open: boolean
    top: number
    left: number
  }
}

const closedMenu = {
  open: false,
  top: 0,
  left: 0,
}

const defaultState: MapState = {
  lastClick: new LngLat(0, 0),
  routePoints: [],
  menu: closedMenu,
}

interface MapProps {}

class Map extends Component<MapProps, MapState> {
  map?: mapboxgl.Map = undefined

  constructor(props: MapProps) {
    super(props)
    this.state = defaultState
    this.handleContextMenu = this.handleContextMenu.bind(this)
    this.closeContextMenu = this.closeContextMenu.bind(this)
    this.addPointToRoute = this.addPointToRoute.bind(this)
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
        initializeMap(
          map,
          this.closeContextMenu,
          this.handleContextMenu,
          allLanes
        )
      }
    )
  }

  handleContextMenu(e: ClickEvent): void {
    this.setState({
      lastClick: e.lngLat,
      menu: {
        open: true,
        top: e.point.y,
        left: e.point.x,
      },
    })
  }

  closeContextMenu(): void {
    this.setState({ menu: closedMenu })
  }

  async addPointToRoute(): Promise<void> {
    this.setState(
      (state): MapState => ({
        ...state,
        menu: closedMenu,
        routePoints: [...state.routePoints, state.lastClick],
      })
    )
    if (this.map) {
      const points = [...this.state.routePoints, this.state.lastClick]
      updateRoutePoints(this.map, points)
      if (points.length > 1) {
        const route = (await axios.post('/api/route', { points })).data
        updateRoute(this.map, route)
      } else {
        updateRoute(this.map)
      }
    }
  }

  render(): React.ReactElement {
    const { open, top, left } = this.state.menu
    return (
      <Container>
        <MapContainer id={elementId} />
        <ContextMenu
          onAdd={this.addPointToRoute}
          open={open}
          top={top}
          left={left}
        />
      </Container>
    )
  }
}

export default Map

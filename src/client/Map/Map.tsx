import React, { Component } from 'react'
import axios from 'axios'
import mapboxgl, { LngLat } from 'mapbox-gl'
import styled from 'styled-components'
import ContextMenu from './ContextMenu'
import RouteDrawer from './RouteDrawer'
import * as helper from './mapbox-helper'
import { LaneCollection, Route } from '../../common/lane'
import { removeIndex } from '../../common/util'

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
  lengths: number[]
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
  lengths: [],
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
    this.addPoint = this.addPoint.bind(this)
    this.deletePoint = this.deletePoint.bind(this)
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
        helper.initializeMap(
          map,
          this.closeContextMenu,
          this.handleContextMenu,
          allLanes
        )
      }
    )
  }

  handleContextMenu(e: helper.ClickEvent): void {
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

  async updateRoute(): Promise<void> {
    if (this.map) {
      const { routePoints } = this.state
      helper.updateRoutePoints(this.map, routePoints)
      if (routePoints.length > 1) {
        const route: Route[] = (await axios.post('/api/route', {
          points: routePoints,
        })).data
        helper.updateRoute(this.map, route)
        this.setState({
          lengths: route.map((segment): number => segment.length),
        })
      } else {
        helper.updateRoute(this.map)
      }
    }
  }

  addPoint(): void {
    this.setState(
      (state): MapState => ({
        ...state,
        menu: closedMenu,
        routePoints: [...state.routePoints, state.lastClick],
      }),
      this.updateRoute
    )
  }

  async deletePoint(i: number): Promise<void> {
    this.setState(
      (state): MapState => ({
        ...state,
        lengths: state.lengths.length ? state.lengths.slice(1) : [],
        routePoints: removeIndex(state.routePoints, i),
      }),
      this.updateRoute
    )
  }

  render(): React.ReactElement {
    const { routePoints, lengths, menu } = this.state
    const { open, top, left } = menu
    return (
      <Container>
        <MapContainer id={elementId} />
        <ContextMenu onAdd={this.addPoint} open={open} top={top} left={left} />
        <RouteDrawer
          onDelete={this.deletePoint}
          points={routePoints}
          lengths={lengths}
        />
      </Container>
    )
  }
}

export default Map

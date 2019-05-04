import React, { Component } from 'react'
import axios from 'axios'
import mapboxgl, { LngLat } from 'mapbox-gl'
import styled from 'styled-components'
import ContextMenu from './ContextMenu'
import Marker, { updateMarkers } from './Marker'
import RouteDrawer from './RouteDrawer'
import * as helper from './mapbox-helper'
import { Route } from '../../common/lane'
import { removeIndex, replaceIndex, insertIndex } from '../../common/util'

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
  markers: Marker[]
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
  markers: [],
  lengths: [],
  menu: closedMenu,
}

class Map extends Component<{}, MapState> {
  map?: mapboxgl.Map = undefined

  constructor(props: {}) {
    super(props)
    this.state = defaultState
    this.handleContextMenu = this.handleContextMenu.bind(this)
    this.closeContextMenu = this.closeContextMenu.bind(this)
    this.handleDragRoute = this.handleDragRoute.bind(this)
    this.handleAddPoint = this.handleAddPoint.bind(this)
    this.deletePoint = this.deletePoint.bind(this)
    this.movePoint = this.movePoint.bind(this)
  }

  componentDidMount(): void {
    const map = new mapboxgl.Map({
      container: elementId,
      style: 'http://localhost:8000/styles/vaylaopas/style.json',
      hash: true,
      zoom: 7,
      center: [24.94, 60.17],
    })
    this.map = map
    map.on(
      'load',
      async (): Promise<void> => {
        helper.initializeMap(
          map,
          this.closeContextMenu,
          this.handleContextMenu,
          this.handleDragRoute
        )
      }
    )
  }

  handleContextMenu(e: helper.MouseEvent): void {
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
      updateMarkers(this.state.markers)
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

  addPoint(i?: number, point?: LngLat): void {
    if (this.map) {
      const index = i || this.state.routePoints.length
      const marker = new Marker(
        index,
        point || this.state.lastClick,
        this.movePoint
      ).addTo(this.map)
      this.setState(
        (state): MapState => ({
          ...state,
          menu: closedMenu,
          routePoints: insertIndex(
            state.routePoints,
            index,
            point || state.lastClick
          ),
          markers: insertIndex(state.markers, index, marker),
        }),
        this.updateRoute
      )
    }
  }

  deletePoint(i: number): void {
    this.state.markers[i].remove()
    this.setState(
      (state): MapState => ({
        ...state,
        lengths: state.lengths.length ? state.lengths.slice(1) : [],
        routePoints: removeIndex(state.routePoints, i),
        markers: removeIndex(state.markers, i),
      }),
      this.updateRoute
    )
  }

  movePoint(i: number, point: LngLat): void {
    this.setState(
      (state): MapState => ({
        ...state,
        routePoints: replaceIndex(state.routePoints, i, point),
      }),
      this.updateRoute
    )
  }

  handleDragRoute(e: helper.MouseEvent, routeNumber: number): void {
    this.addPoint(routeNumber + 1, e.lngLat)
  }

  handleAddPoint(): void {
    this.addPoint()
  }

  render(): React.ReactElement {
    const { routePoints, lengths, menu } = this.state
    const { open, top, left } = menu
    return (
      <Container>
        <MapContainer id={elementId} />
        <ContextMenu
          onAdd={this.handleAddPoint}
          open={open}
          top={top}
          left={left}
        />
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

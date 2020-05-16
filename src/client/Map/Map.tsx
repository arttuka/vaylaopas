import React, { Component, ReactElement } from 'react'
import mapboxgl, { LngLat } from 'mapbox-gl'
import { styled } from '@material-ui/core/styles'
import ContextMenu from './ContextMenu'
import Marker from './Marker'
import TouchMarker from './TouchMarker'
import * as helper from './mapbox-helper'
import { ClientConfig, Route } from '../../common/types'

/* eslint-disable @typescript-eslint/explicit-function-return-type */

declare const clientConfig: ClientConfig

const elementId = 'mapbox-container'
const longTouchDuration = 750

const MapContainer = styled('div')({
  width: '100%',
  height: '100vh',
})

interface MapProps {
  routes: Route[]
  waypoints: LngLat[]
  onAddWaypoint: (point: LngLat, index?: number) => void
  onMoveWaypoint: (point: LngLat, index: number) => void
}

interface MapState {
  lastClick: LngLat
  markers: Marker[]
  menu: {
    open: boolean
    top: number
    left: number
  }
  touchMarker:
    | undefined
    | {
        direction: 'up' | 'down'
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
  markers: [],
  menu: closedMenu,
  touchMarker: undefined,
}

const waypointsEqual = (w1: LngLat[], w2: LngLat[]): boolean => {
  if (w1.length !== w2.length) {
    return false
  }
  for (const i in w1) {
    if (w1[i].lat !== w2[i].lat || w1[i].lng !== w2[i].lng) {
      return false
    }
  }
  return true
}

export default class Map extends Component<MapProps, MapState> {
  map?: mapboxgl.Map = undefined
  containerRef: React.RefObject<HTMLDivElement>

  constructor(props: MapProps) {
    super(props)
    this.state = defaultState
    this.handleContextMenu = this.handleContextMenu.bind(this)
    this.closeContextMenu = this.closeContextMenu.bind(this)
    this.handleDragRoute = this.handleDragRoute.bind(this)
    this.handleAddPoint = this.handleAddPoint.bind(this)
    this.handleLongTouch = this.handleLongTouch.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.containerRef = React.createRef()
  }

  componentDidMount(): void {
    if (this.containerRef.current) {
      this.containerRef.current.style.height = `${window.innerHeight}px`
    }
    const map = new mapboxgl.Map({
      container: elementId,
      style: clientConfig.mapserver,
      hash: true,
      zoom: 7,
      center: [24.94, 60.17],
      dragRotate: false,
    })
    this.map = map
    map.on('load', (): void => {
      helper.initializeMap(
        map,
        {
          handleClick: this.closeContextMenu,
          handleLongTouch: this.handleLongTouch,
          handleContextMenu: this.handleContextMenu,
          handleDragRoute: this.handleDragRoute,
          handleTouchStart: this.handleTouchStart,
          handleTouchEnd: this.handleTouchEnd,
        },
        longTouchDuration
      )
    })
  }

  componentDidUpdate(prevProps: MapProps): void {
    const { onMoveWaypoint, routes, waypoints } = this.props
    const { map } = this
    if (map) {
      helper.updateRoute(map, routes)
      if (!waypointsEqual(waypoints, prevProps.waypoints)) {
        this.state.markers.forEach((m): void => {
          m.remove()
        })
        this.setState({
          markers: waypoints.map(
            (waypoint, index): Marker =>
              new Marker(index, waypoint, onMoveWaypoint).addTo(map)
          ),
        })
      }
    }
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

  handleDragRoute(e: helper.MouseEvent, routeNumber: number): void {
    this.props.onAddWaypoint(e.lngLat, routeNumber + 1)
  }

  handleAddPoint(): void {
    this.props.onAddWaypoint(this.state.lastClick)
    this.setState({ menu: closedMenu })
  }

  handleLongTouch(e: helper.TouchEvent): void {
    e.preventDefault()
    this.props.onAddWaypoint(e.lngLat)
    this.setState({ touchMarker: undefined })
  }

  handleTouchStart(e: helper.TouchEvent): void {
    this.setState({
      touchMarker: {
        direction: 'up',
        top: e.point.y,
        left: e.point.x,
      },
    })
  }

  handleTouchEnd(): void {
    this.setState({ touchMarker: undefined })
  }

  render(): ReactElement {
    const { touchMarker, menu } = this.state
    return (
      <>
        <MapContainer ref={this.containerRef} id={elementId} />
        <ContextMenu
          onAdd={this.handleAddPoint}
          open={menu.open}
          top={menu.top}
          left={menu.left}
        />
        {touchMarker && (
          <TouchMarker
            top={touchMarker.top}
            left={touchMarker.left}
            direction={touchMarker.direction}
            duration={longTouchDuration}
          />
        )}
      </>
    )
  }
}

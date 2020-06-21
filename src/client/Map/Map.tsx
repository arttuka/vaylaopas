import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import mapboxgl from 'mapbox-gl'
import { styled } from '@material-ui/core/styles'
import ContextMenu from './ContextMenu'
import Marker from './Marker'
import TouchMarker from './TouchMarker'
import * as helper from './mapbox-helper'
import { waypointAddAction, waypointMoveAction } from '../redux/actions'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import { LngLat, MenuState, TouchMarkerState } from '../../common/types'

const MapContainer = styled('div')({
  width: '100%',
  height: '100vh',
})

const closedMenu = {
  open: false,
  top: 0,
  left: 0,
}

const Map: FunctionComponent = () => {
  const dispatch = useDispatch()
  const mapRef = useRef<mapboxgl.Map>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [lastClick, setLastClick] = useState<LngLat>({ lng: 0, lat: 0 })
  const [markers, setMarkers] = useState<Marker[]>([])
  const [menu, setMenu] = useState<MenuState>(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState | undefined>()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)

  const onMoveWaypoint = (point: LngLat, index: number): void => {
    dispatch(waypointMoveAction({ point, index }))
  }

  const onAddWaypoint = (): void => {
    dispatch(waypointAddAction({ point: lastClick }))
    setMenu(closedMenu)
  }

  useEffect(() => {
    const container = containerRef.current
    if (container && mapRef.current === undefined) {
      container.style.height = `${window.innerHeight}px`
      mapRef.current = helper.createMap({
        container,
        dispatch,
        setLastClick,
        setMenu,
        setTouchMarker,
      })
    }
  }, [containerRef])

  useEffect(() => {
    const map = mapRef.current
    if (map) {
      helper.updateRoute(map, routes)
    }
  }, [routes])

  useEffect(() => {
    const map = mapRef.current
    if (map) {
      markers.forEach((m): void => {
        m.remove()
      })
      setMarkers(
        waypoints.map(
          (waypoint, index): Marker =>
            new Marker(index, waypoint, onMoveWaypoint).addTo(map)
        )
      )
    }
  }, [waypoints])

  return (
    <>
      <MapContainer ref={containerRef} />
      <ContextMenu
        onAdd={onAddWaypoint}
        open={menu.open}
        top={menu.top}
        left={menu.left}
      />
      {touchMarker && (
        <TouchMarker
          top={touchMarker.top}
          left={touchMarker.left}
          direction={touchMarker.direction}
          duration={helper.longTouchDuration}
        />
      )}
    </>
  )
}

export default Map

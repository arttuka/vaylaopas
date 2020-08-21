import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import mapboxgl, { MapboxGeoJSONFeature } from 'mapbox-gl'
import { styled } from '@material-ui/core/styles'
import ContextMenu from './ContextMenu'
import TouchMarker from './TouchMarker'
import { createMap, longTouchDuration } from '../Mapbox/map'
import {
  generateRouteSources,
  pointFeature,
  setSourceData,
  waypointFeatureCollection,
} from '../Mapbox/source'
import {
  DragEventHandlers,
  Event,
  MouseEvent,
  TouchEvent,
  WaypointFeatureCollection,
} from '../Mapbox/types'
import {
  waypointAddAction,
  waypointMoveAction,
  waypointRemoveAction,
} from '../redux/actions'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import {
  featureIsLane,
  featureIsWaypoint,
  LngLat,
  MenuState,
  TouchMarkerState,
} from '../../common/types'
import { useLocation } from '../../common/util'

const MapContainer = styled('div')({
  width: '100%',
  height: '100vh',
})

const closedMenu = {
  open: false,
  top: 0,
  left: 0,
}

const toLngLat = (e: Event): LngLat => ({
  lng: e.lngLat.lng,
  lat: e.lngLat.lat,
})

const Map: FunctionComponent = () => {
  const dispatch = useDispatch()
  const mapRef = useRef<mapboxgl.Map>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [lastClick, setLastClick] = useState<LngLat>({ lng: 0, lat: 0 })
  const [menu, setMenu] = useState<MenuState>(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState | undefined>()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const waypointsRef = useRef<WaypointFeatureCollection>(
    waypointFeatureCollection(waypoints)
  )

  const handleClick = (): void => setMenu(closedMenu)

  const handleRightClick = (e: MouseEvent): void => {
    const feature = e.features && e.features[0]
    const waypoint = featureIsWaypoint(feature) && feature.properties.id
    e.preventDefault()
    setLastClick(toLngLat(e))
    setMenu({
      ...menu,
      open: true,
      top: e.point.y,
      left: e.point.x,
      ...(waypoint ? { waypoint } : {}),
    })
  }

  const handleLongTouch = (e: TouchEvent): void => {
    e.preventDefault()
    dispatch(waypointAddAction({ point: toLngLat(e), type: 'destination' }))
    setTouchMarker(undefined)
  }

  const handleTouchStart = (e: TouchEvent): void =>
    setTouchMarker({
      direction: 'up',
      top: e.point.y,
      left: e.point.x,
    })

  const handleTouchEnd = (): void => setTouchMarker(undefined)

  const handleDragRoute = (
    map: mapboxgl.Map,
    feature?: MapboxGeoJSONFeature
  ): DragEventHandlers => {
    if (featureIsLane(feature)) {
      const onMove = (e: Event): void =>
        setSourceData(map, {
          id: 'dragIndicator',
          data: pointFeature(e.lngLat),
        })
      const onMoveEnd = (e: Event): void => {
        setSourceData(map, { id: 'dragIndicator', data: pointFeature() })
        dispatch(
          waypointAddAction({
            point: toLngLat(e),
            index: feature.properties.route + 1,
            type: 'waypoint',
          })
        )
      }
      return { onMove, onMoveEnd }
    } else {
      throw new Error('dragIndicator feature had unexpected type')
    }
  }

  const handleDragWaypoint = (
    map: mapboxgl.Map,
    feature?: MapboxGeoJSONFeature
  ): DragEventHandlers => {
    if (featureIsWaypoint(feature)) {
      const waypointId = feature.properties.id
      const waypointCollection = waypointsRef.current
      const index = waypointCollection.features.findIndex(
        ({ properties }) => properties.id === waypointId
      )
      const onMove = (e: Event): void => {
        if (index >= 0) {
          const { lng, lat } = e.lngLat
          waypointCollection.features[index].geometry.coordinates = [lng, lat]
          setSourceData(map, { id: 'waypoint', data: waypointCollection })
        }
      }
      const onMoveEnd = (e: Event): void => {
        dispatch(
          waypointMoveAction({
            point: toLngLat(e),
            id: waypointId,
          })
        )
      }
      return { onMove, onMoveEnd }
    } else {
      throw new Error('waypoint feature had unexpected type')
    }
  }

  const onAddWaypoint = (): void => {
    dispatch(waypointAddAction({ point: lastClick, type: 'destination' }))
    setMenu(closedMenu)
  }

  const onDeleteWaypoint = (id: string): void => {
    dispatch(waypointRemoveAction({ id }))
    setMenu(closedMenu)
  }

  useEffect(() => {
    const container = containerRef.current
    if (container && mapRef.current === undefined) {
      container.style.height = `${window.innerHeight}px`
      mapRef.current = createMap(
        container,
        {
          handleClick,
          handleRightClick,
          handleLongTouch,
          handleDragRoute,
          handleTouchStart,
          handleTouchEnd,
          handleDragWaypoint,
        },
        [
          ...generateRouteSources(routes),
          { id: 'dragIndicator', data: pointFeature() },
          { id: 'location', data: pointFeature() },
          { id: 'waypoint', data: waypointsRef.current },
        ]
      )
    }
  }, [containerRef])

  useEffect(() => {
    const map = mapRef.current
    if (map) {
      generateRouteSources(routes).forEach((source) =>
        setSourceData(map, source)
      )
    }
  }, [routes])

  useEffect(() => {
    const map = mapRef.current
    if (map) {
      waypointsRef.current = waypointFeatureCollection(waypoints)
      setSourceData(map, { id: 'waypoint', data: waypointsRef.current })
    }
  }, [waypoints])

  useLocation((coords?: Coordinates): void => {
    const map = mapRef.current
    if (map) {
      setSourceData(map, {
        id: 'location',
        data: pointFeature(
          coords && new mapboxgl.LngLat(coords.longitude, coords.latitude)
        ),
      })
    }
  })

  return (
    <>
      <MapContainer ref={containerRef} />
      <ContextMenu
        onAdd={onAddWaypoint}
        onDelete={onDeleteWaypoint}
        {...menu}
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

export default Map

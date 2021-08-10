import React, { FunctionComponent, useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@material-ui/styles'
import { Map, Point, GeolocateControl, NavigationControl } from 'maplibre-gl'
import MapFeatures from './MapFeatures'
import { useMap, longTouchDuration } from '../Mapbox/map'
import { makeLayerDraggable } from '../Mapbox/layer'
import {
  generateRouteSources,
  pointFeature,
  waypointFeatureCollection,
} from '../Mapbox/source'
import {
  DragStartHandler,
  Event,
  MouseEventHandler,
  TouchEventHandler,
  TouchEvent,
  Sources,
} from '../Mapbox/types'
import { waypointAddAction, waypointMoveAction } from '../redux/actions'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import {
  featureIsLane,
  featureIsWaypoint,
  Lane,
  LngLat,
  MenuState,
  TouchMarkerState,
  WaypointFeature,
  WaypointProperties,
} from '../../common/types'
import { calculateOffset, applyOffset } from '../../common/util'

const closedMenu: MenuState = {
  open: false,
  top: 0,
  left: 0,
}

const toLngLat = (e: Event): LngLat => ({
  lng: e.lngLat.lng,
  lat: e.lngLat.lat,
})
const sqDistance = (
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point
): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}
const eventToWaypoint = (e: Event): WaypointProperties | undefined => {
  const feature = e.features && e.features[0]
  return featureIsWaypoint(feature) ? feature.properties : undefined
}

const Container = styled('div')({
  flex: 1,
})

const MapContainer: FunctionComponent = () => {
  const dispatch = useDispatch()
  const [lastClick, setLastClick] = useState({ lng: 0, lat: 0 })
  const [menu, setMenu] = useState(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState>()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const waypointsRef = useRef(waypointFeatureCollection(waypoints))
  const [sources, setSources] = useState<Sources>({
    ...generateRouteSources(routes),
    dragIndicator: { id: 'dragIndicator', data: pointFeature() },
    waypoint: { id: 'waypoint', data: waypointsRef.current },
  })
  const setSource = (newSources: Partial<Sources>): void => {
    setSources((sources) => ({
      ...sources,
      ...newSources,
    }))
  }

  const onInit = (map: Map): void => {
    let longTouchTimer = 0
    let shortTouch = false
    const onTouchEnd = (e: TouchEvent): void => {
      window.clearTimeout(longTouchTimer)
      handleTouchEnd(e, shortTouch)
    }
    const onTouchCancel = (e: TouchEvent): void => {
      window.clearTimeout(longTouchTimer)
      shortTouch = false
      handleTouchEnd(e, false)
    }

    map.touchZoomRotate.disableRotation()
    map
      .addControl(
        new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
        })
      )
      .addControl(new NavigationControl({ showCompass: false }))
      .on('click', handleClick)
      .on('contextmenu', handleRightClick)
      .on('contextmenu', 'waypoint', handleRightClick)
      .on('touchstart', (e): void => {
        window.clearTimeout(longTouchTimer)
        handleTouchStart(e)
        shortTouch = true
        longTouchTimer = window.setTimeout((): void => {
          handleLongTouch(e)
        }, longTouchDuration)
      })
      .on('touchend', onTouchEnd)
      .on('touchend', 'waypoint', onTouchEnd)
      .on('touchcancel', onTouchCancel)
      .on('touchmove', onTouchCancel)

    makeLayerDraggable(map, 'route', handleDragRoute, featureIsLane)
    makeLayerDraggable(map, 'waypoint', handleDragWaypoint, featureIsWaypoint)
  }

  const setContainerRef = useMap({
    zoom: 11,
    center: [24.94, 60.17],
    sources,
    onInit,
  })

  const openMenu = (p: Point, waypoint?: WaypointProperties) => {
    setMenu((menu) => ({
      ...menu,
      open: true,
      top: p.y + 64,
      left: p.x,
      ...(waypoint
        ? {
            waypoint: waypoint.id,
            isDestination: waypoint.type === 'destination',
          }
        : {}),
    }))
  }

  const handleClick: MouseEventHandler = (e) => {
    setMenu(closedMenu)
    e.preventDefault()
  }

  const handleRightClick: MouseEventHandler = (e) => {
    e.preventDefault()
    setLastClick(toLngLat(e))
    openMenu(e.point, eventToWaypoint(e))
  }

  const handleLongTouch: TouchEventHandler = (e) => {
    e.preventDefault()
    dispatch(waypointAddAction({ point: toLngLat(e), type: 'destination' }))
    setTouchMarker(undefined)
  }

  const handleTouchStart: TouchEventHandler = (e) =>
    setTouchMarker({
      direction: 'up',
      top: e.point.y + 56,
      left: e.point.x,
    })

  const handleTouchEnd: TouchEventHandler = (e, shortTouch) => {
    e.preventDefault()
    setTouchMarker(undefined)
    const waypoint = eventToWaypoint(e)
    if (shortTouch && waypoint) {
      e.originalEvent.preventDefault()
      openMenu(e.point, waypoint)
    }
  }

  const handleDragRoute: DragStartHandler<Lane> = (e, feature, type) => {
    const origin = e.point
    let dragStarted = false
    return {
      onMove: (e) => {
        if (!dragStarted && sqDistance(origin, e.point) > 1000) {
          dragStarted = true
        }
        if (dragStarted) {
          setSource({
            dragIndicator: {
              id: 'dragIndicator',
              data: pointFeature(e.lngLat, type === 'touch'),
            },
          })
        }
      },
      onMoveEnd: (e) => {
        setSource({
          dragIndicator: { id: 'dragIndicator', data: pointFeature() },
        })
        if (sqDistance(origin, e.point) > 1000) {
          dispatch(
            waypointAddAction({
              point: toLngLat(e),
              index: feature.properties.route + 1,
              type: 'waypoint',
            })
          )
        }
      },
    }
  }

  const handleDragWaypoint: DragStartHandler<WaypointFeature> = (
    e,
    feature,
    type
  ) => {
    const offset = calculateOffset(e.lngLat, feature.geometry.coordinates)
    const waypointId = feature.properties.id
    const waypointCollection = waypointsRef.current
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const waypoint = waypointCollection.features.find(
      ({ properties }) => properties.id === waypointId
    )!
    if (type === 'touch') {
      waypoint.properties.dragged = true
    }
    return {
      onMove: (e) => {
        const { lng, lat } = applyOffset(e.lngLat, offset)
        waypoint.geometry.coordinates = [lng, lat]
        setSource({ waypoint: { id: 'waypoint', data: waypointCollection } })
      },
      onMoveEnd: (e) => {
        dispatch(
          waypointMoveAction({
            point: applyOffset(e.lngLat, offset),
            id: waypointId,
          })
        )
      },
    }
  }
  useEffect(() => {
    setSource(generateRouteSources(routes))
  }, [routes])

  useEffect(() => {
    waypointsRef.current = waypointFeatureCollection(waypoints)
    setSource({ waypoint: { id: 'waypoint', data: waypointsRef.current } })
  }, [waypoints])

  return (
    <>
      <Container ref={setContainerRef} />
      <MapFeatures
        lastClick={lastClick}
        touchMarker={touchMarker}
        menu={menu}
        closeMenu={() => setMenu(closedMenu)}
      />
    </>
  )
}

export default MapContainer

import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import {
  Map,
  GeolocateControl,
  NavigationControl,
  MapLayerTouchEvent,
} from 'maplibre-gl'
import MapFeatures from './MapFeatures'
import Marker from './Marker'
import { useMap, longTouchDuration } from '../Mapbox/map'
import { makeLayerDraggable } from '../Mapbox/layer'
import { generateRouteSources, pointFeature } from '../Mapbox/source'
import {
  DragStartHandler,
  Event,
  MouseEventHandler,
  TouchEventHandler,
  Sources,
} from '../Mapbox/types'
import { waypointAddAction, waypointMoveAction } from '../redux/actions'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import {
  featureIsLane,
  Lane,
  LngLat,
  MenuState,
  Point,
  TouchMarkerState,
  Waypoint,
  WaypointProperties,
} from '../../common/types'
import { getStoredSetting, storeSetting, throttle } from '../../common/util'

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

const Container = styled('div')({
  flex: 1,
})

type MapContainerProps = {
  mapserverUrl: string
}

const MapContainer: FunctionComponent<MapContainerProps> = ({
  mapserverUrl,
}) => {
  const dispatch = useDispatch()
  const [lastClick, setLastClick] = useState({ lng: 0, lat: 0 })
  const [menu, setMenu] = useState(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState>()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const [sources, setSources] = useState<Sources>({
    ...generateRouteSources(routes),
    dragIndicator: { id: 'dragIndicator', data: pointFeature() },
  })
  const setSource = useCallback((newSources: Partial<Sources>): void => {
    setSources((sources) => ({
      ...sources,
      ...newSources,
    }))
  }, [])

  const onInit = useCallback((map: Map): void => {
    let longTouchTimer = 0
    let shortTouch = false
    const onTouchEnd = (e: MapLayerTouchEvent): void => {
      window.clearTimeout(longTouchTimer)
      handleTouchEnd(e, shortTouch)
    }

    const onTouchCancel = (e: MapLayerTouchEvent): void => {
      window.clearTimeout(longTouchTimer)
      shortTouch = false
      handleTouchEnd(e, false)
    }

    const handleClick: MouseEventHandler = (e) => {
      setMenu(closedMenu)
      e.preventDefault()
    }

    const handleRightClick: MouseEventHandler = (e) => {
      e.preventDefault()
      setLastClick(toLngLat(e))
      openMenu(e.point)
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

    const handleTouchEnd: TouchEventHandler = (e) => {
      e.preventDefault()
      setTouchMarker(undefined)
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

    const onRender = throttle(() => {
      storeSetting('zoom', map.getZoom())
      const { lng, lat } = map.getCenter()
      storeSetting('centerLng', lng)
      storeSetting('centerLat', lat)
    }, 50)

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
      .on('touchstart', (e): void => {
        window.clearTimeout(longTouchTimer)
        handleTouchStart(e)
        shortTouch = true
        longTouchTimer = window.setTimeout((): void => {
          handleLongTouch(e)
        }, longTouchDuration)
      })
      .on('touchend', onTouchEnd)
      .on('touchcancel', onTouchCancel)
      .on('touchmove', onTouchCancel)
      .on('render', onRender)

    makeLayerDraggable(map, 'route', handleDragRoute, featureIsLane)
  }, [])

  const { setContainerRef, map } = useMap({
    zoom: getStoredSetting('zoom') || 11,
    center: [
      getStoredSetting('centerLng') || 24.94,
      getStoredSetting('centerLat') || 60.17,
    ],
    sources,
    onInit,
    mapserverUrl,
  })

  const openMenu = useCallback((p: Point, waypoint?: WaypointProperties) => {
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
  }, [])

  const handleDragWaypoint = (id: string, lngLat: LngLat): void => {
    dispatch(
      waypointMoveAction({
        point: lngLat,
        id,
      })
    )
  }

  const handleWaypointContextmenu = (
    waypoint: Waypoint,
    lngLat: LngLat,
    point: Point
  ): void => {
    setLastClick(lngLat)
    openMenu(point, { ...waypoint, dragged: false })
  }

  useEffect(() => {
    setSource(generateRouteSources(routes))
  }, [routes])

  return (
    <>
      <Container ref={setContainerRef} />
      {map &&
        waypoints.map((waypoint) => (
          <Marker
            key={waypoint.id}
            waypoint={waypoint}
            map={map}
            onDragEnd={handleDragWaypoint}
            onContextMenu={handleWaypointContextmenu}
          />
        ))}
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

import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Layer from './Layer'
import Marker from './Marker'
import Map from './Map'
import Source from './Source'
import { layers } from '../Mapbox/layer'
import { generateRouteSources, pointFeature } from '../Mapbox/source'
import {
  DragStartHandler,
  Event,
  MapEventHandler,
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
import TouchMarker from './TouchMarker'
import ContextMenu from './ContextMenu'

const longTouchDuration = 750

const closedMenu: MenuState = {
  open: false,
  top: 0,
  left: 0,
}

const toLngLat = (e: Event): LngLat => ({
  lng: e.lngLat.lng,
  lat: e.lngLat.lat,
})

const sqDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return dx * dx + dy * dy
}

const MapContainer: FC<{ mapserverUrl: string }> = ({ mapserverUrl }) => {
  const dispatch = useDispatch()
  const [lastClick, setLastClick] = useState({ lng: 0, lat: 0 })
  const [menu, setMenu] = useState(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState>()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const longTouchTimer = useRef(0)
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

  const openMenu = useCallback(
    (p: Point, waypoint?: WaypointProperties) =>
      setMenu((menu) => ({
        ...menu,
        open: true,
        top: p.y + 64,
        left: p.x,
        waypoint: waypoint?.id,
        isDestination: waypoint?.type === 'destination',
      })),
    []
  )
  const closeMenu = useCallback(() => setMenu(closedMenu), [])

  const onClick: MouseEventHandler = useCallback((e) => {
    closeMenu()
    e.preventDefault()
  }, [])

  const onContextMenu: MouseEventHandler = useCallback((e) => {
    e.preventDefault()
    setLastClick(toLngLat(e))
    openMenu(e.point)
  }, [])

  const onTouchStart: TouchEventHandler = useCallback((e) => {
    window.clearTimeout(longTouchTimer.current)
    setTouchMarker({
      direction: 'up',
      top: e.point.y + 56,
      left: e.point.x,
    })
    longTouchTimer.current = window.setTimeout((): void => {
      e.preventDefault()
      dispatch(waypointAddAction({ point: toLngLat(e), type: 'destination' }))
      setTouchMarker(undefined)
    }, longTouchDuration)
  }, [])

  const onTouchEnd: TouchEventHandler = useCallback((e) => {
    window.clearTimeout(longTouchTimer.current)
    e.preventDefault()
    setTouchMarker(undefined)
  }, [])

  const onRender: MapEventHandler = useCallback(
    throttle(({ target }) => {
      storeSetting('zoom', target.getZoom())
      const { lng, lat } = target.getCenter()
      storeSetting('centerLng', lng)
      storeSetting('centerLat', lat)
    }, 50),
    []
  )

  const handleDragRoute: DragStartHandler<Lane> = useCallback(
    (e, feature, type) => {
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
    },
    []
  )

  const handleDragWaypoint = useCallback((id: string, lngLat: LngLat): void => {
    dispatch(
      waypointMoveAction({
        point: lngLat,
        id,
      })
    )
  }, [])

  const handleWaypointContextmenu = useCallback(
    (waypoint: Waypoint, lngLat: LngLat, point: Point): void => {
      setLastClick(lngLat)
      openMenu(point, { ...waypoint, dragged: false })
    },
    []
  )

  useEffect(() => {
    setSource(generateRouteSources(routes))
  }, [routes])

  return (
    <>
      <Map
        zoom={getStoredSetting('zoom') || 11}
        center={[
          getStoredSetting('centerLng') || 24.94,
          getStoredSetting('centerLat') || 60.17,
        ]}
        mapserverUrl={mapserverUrl}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
        onRender={onRender}
      >
        {waypoints.map((waypoint) => (
          <Marker
            key={waypoint.id}
            waypoint={waypoint}
            onDragEnd={handleDragWaypoint}
            onContextMenu={handleWaypointContextmenu}
          />
        ))}
        <Source source={sources.dragIndicator}>
          <Layer layer={layers.dragIndicator} />
        </Source>
        <Source source={sources.notFoundRoute}>
          <Layer layer={layers.notFoundRoute} />
        </Source>
        <Source source={sources.route}>
          <Layer
            layer={layers.route}
            onDrag={handleDragRoute}
            isFeature={featureIsLane}
          />
        </Source>
        <Source source={sources.routeStartAndEnd}>
          <Layer layer={layers.routeStartAndEnd} />
        </Source>
      </Map>
      {touchMarker && (
        <TouchMarker {...touchMarker} duration={longTouchDuration} />
      )}
      <ContextMenu {...menu} closeMenu={closeMenu} point={lastClick} />
    </>
  )
}

export default MapContainer

import React, { FC, useCallback, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import Marker from './Marker'
import Map from './Map'
import Source from './Source'
import { layers } from '../Mapbox/layer'
import {
  featureCollection,
  generateRouteSources,
  pointFeature,
} from '../Mapbox/source'
import {
  DragStartHandler,
  Event,
  MapEventHandler,
  MouseEventHandler,
  TouchEventHandler,
  Sources,
} from '../Mapbox/types'
import {
  featureIsRouteFeature,
  RouteFeature,
  LngLat,
  MenuState,
  Point,
  TouchMarkerState,
  Waypoint,
  WaypointProperties,
} from '../../common/types'
import {
  getStoredSetting,
  sqDistance,
  storeSetting,
  throttle,
} from '../../common/util'
import { useStore } from '../store/store'
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

const MapContainer: FC<{ mapserverUrl: string }> = ({ mapserverUrl }) => {
  const draggingMarker = useRef(false)
  const [lastClick, setLastClick] = useState({ lng: 0, lat: 0 })
  const [menu, setMenu] = useState(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState>()
  const { routes, waypointLines, waypoints, editWaypoints } = useStore(
    useShallow((state) => ({
      routes: state.routes,
      waypointLines: state.waypointLines,
      waypoints: state.waypoints,
      editWaypoints: state.editWaypoints,
    }))
  )
  const { route: routeSource, notFoundRoute: notFoundRouteSource } = useMemo(
    () => generateRouteSources(routes),
    [routes]
  )
  const waypointLineSource = useMemo<Sources['waypointLine']>(
    () => ({
      id: 'waypointLine',
      data: featureCollection(waypointLines),
    }),
    [waypointLines]
  )
  const [dragIndicatorSource, setDragIndicatorSource] = useState<
    Sources['dragIndicator']
  >({
    id: 'dragIndicator',
    data: pointFeature(),
  })
  const longTouchTimer = useRef(0)

  const openMenu = useCallback(
    (p: Point, waypoint?: WaypointProperties) =>
      setMenu((menu) => ({
        ...menu,
        open: true,
        top: p.y + 64,
        left: p.x,
        waypoint: waypoint?.id,
        waypointType: waypoint?.type,
      })),
    []
  )
  const closeMenu = useCallback(() => setMenu(closedMenu), [])

  const onClick: MouseEventHandler = useCallback(
    (e) => {
      closeMenu()
      e.preventDefault()
    },
    [closeMenu]
  )

  const onContextMenu: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault()
      setLastClick(toLngLat(e))
      openMenu(e.point)
    },
    [openMenu]
  )

  const onTouchStart: TouchEventHandler = useCallback(
    (e) => {
      window.clearTimeout(longTouchTimer.current)
      setTouchMarker({
        direction: 'up',
        top: e.point.y + 56,
        left: e.point.x,
      })
      longTouchTimer.current = window.setTimeout((): void => {
        e.preventDefault()
        editWaypoints({
          type: 'add',
          point: toLngLat(e),
          waypointType: 'destination',
        })
        setTouchMarker(undefined)
      }, longTouchDuration)
    },
    [editWaypoints]
  )

  const onTouchEnd: TouchEventHandler = useCallback((e) => {
    window.clearTimeout(longTouchTimer.current)
    e.preventDefault()
    setTouchMarker(undefined)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onRender: MapEventHandler = useCallback(
    throttle(({ target }) => {
      storeSetting('zoom', target.getZoom())
      const { lng, lat } = target.getCenter()
      storeSetting('centerLng', lng)
      storeSetting('centerLat', lat)
    }, 50),
    []
  )

  const handleDragRoute: DragStartHandler<RouteFeature> = useCallback(
    (e, feature, type) => {
      const origin = e.point
      let dragStarted = false
      return {
        onMove: (e) => {
          if (!dragStarted && sqDistance(origin, e.point) > 1000) {
            dragStarted = true
          }
          if (dragStarted) {
            setDragIndicatorSource({
              id: 'dragIndicator',
              data: draggingMarker.current
                ? pointFeature()
                : pointFeature(e.lngLat, type === 'touch'),
            })
          }
        },
        onMoveEnd: (e) => {
          setDragIndicatorSource({ id: 'dragIndicator', data: pointFeature() })
          if (!draggingMarker.current && sqDistance(origin, e.point) > 1000) {
            editWaypoints({
              type: 'add',
              point: toLngLat(e),
              index: feature.properties.routeIndex + 1,
              waypointType:
                feature.properties.routeType === 'outside'
                  ? 'viadirect'
                  : 'via',
            })
          }
        },
      }
    },
    [editWaypoints]
  )

  const handleDragWaypoint = useCallback(
    (id: string, lngLat: LngLat): void => {
      editWaypoints({
        type: 'move',
        point: lngLat,
        id,
      })
    },
    [editWaypoints]
  )

  const handleWaypointContextmenu = useCallback(
    (waypoint: Waypoint, lngLat: LngLat, point: Point): void => {
      setLastClick(lngLat)
      openMenu(point, { ...waypoint, dragged: false })
    },
    [openMenu]
  )

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
            draggingRef={draggingMarker}
            onDragEnd={handleDragWaypoint}
            onContextMenu={handleWaypointContextmenu}
          />
        ))}
        <Source
          source={dragIndicatorSource}
          layers={[{ layer: layers.dragIndicator }]}
        />
        <Source
          source={notFoundRouteSource}
          layers={[{ layer: layers.notFoundRoute }]}
        />
        <Source
          source={routeSource}
          layers={[
            {
              layer: layers.route,
              onDrag: handleDragRoute,
              isFeature: featureIsRouteFeature,
            },
          ]}
        />
        <Source
          source={waypointLineSource}
          layers={[{ layer: layers.waypointLine }]}
        />
      </Map>
      {touchMarker && (
        <TouchMarker {...touchMarker} duration={longTouchDuration} />
      )}
      <ContextMenu {...menu} closeMenu={closeMenu} point={lastClick} />
    </>
  )
}

export default MapContainer

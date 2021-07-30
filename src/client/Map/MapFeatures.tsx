import React, { FunctionComponent, useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Point } from 'maplibre-gl'
import ContextMenu from './ContextMenu'
import TouchMarker from './TouchMarker'
import { initializeMap, longTouchDuration } from '../Mapbox/map'
import {
  generateRouteSources,
  pointFeature,
  setSourceData,
  waypointFeatureCollection,
} from '../Mapbox/source'
import {
  DragStartHandler,
  Event,
  Map,
  MouseEventHandler,
  TouchEventHandler,
} from '../Mapbox/types'
import {
  waypointAddAction,
  waypointChangeAction,
  waypointMoveAction,
  waypointRemoveAction,
} from '../redux/actions'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import {
  featureIsWaypoint,
  Lane,
  LngLat,
  MenuState,
  TouchMarkerState,
  WaypointFeature,
  WaypointProperties,
  WaypointType,
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

interface MapFeaturesProps {
  map: Map
}

const MapFeatures: FunctionComponent<MapFeaturesProps> = ({ map }) => {
  const dispatch = useDispatch()
  const [lastClick, setLastClick] = useState({ lng: 0, lat: 0 })
  const [menu, setMenu] = useState(closedMenu)
  const [touchMarker, setTouchMarker] = useState<TouchMarkerState>()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const waypointsRef = useRef(waypointFeatureCollection(waypoints))

  const handleClick: MouseEventHandler = (e) => {
    setMenu(closedMenu)
    e.preventDefault()
  }

  const eventToWaypoint = (e: Event): WaypointProperties | undefined => {
    const feature = e.features && e.features[0]
    return featureIsWaypoint(feature) ? feature.properties : undefined
  }

  const openMenu = (p: Point, waypoint?: WaypointProperties) => {
    setMenu({
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
    })
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

  const handleDragRoute: DragStartHandler<Lane> = (e, feature) => ({
    onMove: (e) =>
      setSourceData(map, {
        id: 'dragIndicator',
        data: pointFeature(e.lngLat),
      }),
    onMoveEnd: (e) => {
      setSourceData(map, { id: 'dragIndicator', data: pointFeature() })
      dispatch(
        waypointAddAction({
          point: toLngLat(e),
          index: feature.properties.route + 1,
          type: 'waypoint',
        })
      )
    },
  })

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
        setSourceData(map, { id: 'waypoint', data: waypointCollection })
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

  const onAddWaypoint = (): void => {
    dispatch(waypointAddAction({ point: lastClick, type: 'destination' }))
    setMenu(closedMenu)
  }

  const onDeleteWaypoint = (id: string): void => {
    dispatch(waypointRemoveAction({ id }))
    setMenu(closedMenu)
  }

  const onChangeWaypoint = (id: string, type: WaypointType): void => {
    dispatch(waypointChangeAction({ id, type }))
    setMenu(closedMenu)
  }

  useEffect(() => {
    if (!map.initialized) {
      initializeMap(
        map,
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
          { id: 'waypoint', data: waypointsRef.current },
        ]
      )
      map.initialized = true
    }
  }, [])

  useEffect(() => {
    generateRouteSources(routes).forEach((source) => setSourceData(map, source))
  }, [routes])

  useEffect(() => {
    waypointsRef.current = waypointFeatureCollection(waypoints)
    setSourceData(map, { id: 'waypoint', data: waypointsRef.current })
  }, [waypoints])

  return (
    <>
      <ContextMenu
        onAdd={onAddWaypoint}
        onChange={onChangeWaypoint}
        onDelete={onDeleteWaypoint}
        onClose={() => {
          setMenu(closedMenu)
        }}
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

export default MapFeatures

import { useCallback, useRef, useState } from 'react'
import {
  GeolocateControl,
  Map as MapboxMap,
  NavigationControl,
} from 'maplibre-gl'
import { addLayers, makeLayerDraggable } from './layer'
import { addSources } from './source'
import {
  DragStartHandler,
  Map,
  MouseEventHandler,
  Sources,
  TouchEvent,
  TouchEventHandler,
} from './types'
import { addMapLoad } from '../api'
import {
  ClientConfig,
  Lane,
  WaypointFeature,
  featureIsLane,
  featureIsWaypoint,
} from '../../common/types'

declare const clientConfig: ClientConfig
export const longTouchDuration = 750

interface EventHandlers {
  handleClick: MouseEventHandler
  handleRightClick: MouseEventHandler
  handleLongTouch: TouchEventHandler
  handleTouchStart: TouchEventHandler
  handleTouchEnd: TouchEventHandler
  handleDragRoute: DragStartHandler<Lane>
  handleDragWaypoint: DragStartHandler<WaypointFeature>
}

export const initializeMap = (
  map: Map,
  eventHandlers: EventHandlers,
  sources: Sources[]
): void => {
  const {
    handleClick,
    handleRightClick,
    handleLongTouch,
    handleDragRoute,
    handleTouchStart,
    handleTouchEnd,
    handleDragWaypoint,
  } = eventHandlers

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
  addSources(map, sources)
  addLayers(map)
  map
    .addControl(
      new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
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

export const useMap = (): [
  (container: HTMLDivElement) => void,
  Map | undefined
] => {
  const mapRef = useRef<Map>()
  const [initialized, setInitialized] = useState(false)
  const setContainerRef = useCallback((container: HTMLDivElement | null) => {
    if (container == null) {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = undefined
      }
      setInitialized(false)
    } else {
      const map = new MapboxMap({
        container,
        style: clientConfig.mapserver,
        hash: true,
        zoom: 11,
        center: [24.94, 60.17],
        dragRotate: false,
      }) as Map
      map.initialized = false
      map.on('load', (): void => {
        setInitialized(true)
        addMapLoad()
      })
      mapRef.current = map
    }
  }, [])
  return [setContainerRef, initialized ? mapRef.current : undefined]
}

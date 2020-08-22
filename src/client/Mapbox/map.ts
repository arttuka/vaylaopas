import { useCallback, useRef, useState } from 'react'
import { GeolocateControl, Map, NavigationControl } from 'mapbox-gl'
import { addLayers, makeLayerDraggable } from './layer'
import { addSources } from './source'
import {
  DragStartHandler,
  MouseEventHandler,
  Source,
  TouchEvent,
  TouchEventHandler,
} from './types'
import { ClientConfig } from '../../common/types'

declare const clientConfig: ClientConfig
export const longTouchDuration = 750

interface EventHandlers {
  handleClick: MouseEventHandler
  handleRightClick: MouseEventHandler
  handleLongTouch: TouchEventHandler
  handleTouchStart: TouchEventHandler
  handleTouchEnd: TouchEventHandler
  handleDragRoute: DragStartHandler
  handleDragWaypoint: DragStartHandler
}

export const initializeMap = (
  map: Map,
  eventHandlers: EventHandlers,
  sources: Source[]
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
  const onTouchEnd = (e: TouchEvent): void => {
    window.clearTimeout(longTouchTimer)
    handleTouchEnd(e)
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
      longTouchTimer = window.setTimeout((): void => {
        handleLongTouch(e)
      }, longTouchDuration)
    })
    .on('touchend', onTouchEnd)
    .on('touchcancel', onTouchEnd)
    .on('touchmove', onTouchEnd)

  makeLayerDraggable(map, 'route', handleDragRoute)
  makeLayerDraggable(map, 'waypoint', handleDragWaypoint)
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
      const map = new Map({
        container,
        style: clientConfig.mapserver,
        hash: true,
        zoom: 11,
        center: [24.94, 60.17],
        dragRotate: false,
      })
      map.on('load', (): void => setInitialized(true))
      mapRef.current = map
    }
  }, [])
  return [setContainerRef, initialized ? mapRef.current : undefined]
}

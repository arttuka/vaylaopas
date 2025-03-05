import { RefObject, useEffect, useState } from 'react'
import { Map, GeolocateControl, NavigationControl } from 'maplibre-gl'
import {
  MapEventHandler,
  MouseEventHandler,
  TouchEventHandler,
} from '../Mapbox/types'

export type MapProps = {
  center: [number, number]
  zoom: number
  mapserverUrl: string
  onClick: MouseEventHandler
  onContextMenu: MouseEventHandler
  onRender: MapEventHandler
  onTouchEnd: TouchEventHandler
  onTouchStart: TouchEventHandler
}

export const useMaplibreMap = (
  containerRef: RefObject<HTMLDivElement | null>,
  {
    center,
    zoom,
    mapserverUrl,
    onClick,
    onContextMenu,
    onRender,
    onTouchEnd,
    onTouchStart,
  }: MapProps
): Map | undefined => {
  const [map, setMap] = useState<Map>()
  useEffect(() => {
    const maplibreMap = new Map({
      container: containerRef.current!,
      style: mapserverUrl,
      hash: true,
      zoom,
      center,
      dragRotate: false,
    })
    maplibreMap.on('load', () => {
      setMap(maplibreMap)
      maplibreMap.touchZoomRotate.disableRotation()
      maplibreMap
        .addControl(
          new GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
          })
        )
        .addControl(new NavigationControl({ showCompass: false }))
      maplibreMap.on('click', onClick)
      maplibreMap.on('contextmenu', onContextMenu)
      maplibreMap.on('touchstart', onTouchStart)
      maplibreMap.on('touchend', onTouchEnd)
      maplibreMap.on('touchcancel', onTouchEnd)
      maplibreMap.on('touchmove', onTouchEnd)
      maplibreMap.on('render', onRender)
    })
    return () => {
      maplibreMap.remove()
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return map
}

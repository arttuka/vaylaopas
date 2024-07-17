import { RefObject, useEffect, useState } from 'react'
import { Map, GeolocateControl, NavigationControl } from 'maplibre-gl'
import {
  MapEventHandler,
  MouseEventHandler,
  TouchEventHandler,
} from '../Mapbox/types'
import { addMapLoad } from '../api'

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
  containerRef: RefObject<HTMLDivElement>,
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
      container:
        containerRef.current! /* eslint-disable-line @typescript-eslint/no-non-null-assertion */,
      style: mapserverUrl,
      hash: true,
      zoom,
      center,
      dragRotate: false,
    })
    maplibreMap.on('load', () => {
      setMap(maplibreMap)
      addMapLoad()
      maplibreMap.touchZoomRotate.disableRotation()
      maplibreMap
        .addControl(
          new GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: true,
          })
        )
        .addControl(new NavigationControl({ showCompass: false }))
        .on('click', onClick)
        .on('contextmenu', onContextMenu)
        .on('touchstart', onTouchStart)
        .on('touchend', onTouchEnd)
        .on('touchcancel', onTouchEnd)
        .on('touchmove', onTouchEnd)
        .on('render', onRender)
    })
    return () => {
      maplibreMap.remove()
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return map
}

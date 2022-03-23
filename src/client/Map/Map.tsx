import React, { ReactNode, VFC, useEffect, useRef, useState } from 'react'
import {
  Map as MaplibreMap,
  GeolocateControl,
  NavigationControl,
} from 'maplibre-gl'
import { styled } from '@mui/material/styles'
import {
  MapEventHandler,
  MouseEventHandler,
  TouchEventHandler,
} from '../Mapbox/types'
import { addMapLoad } from '../api'
import { MapContextProvider } from './map-context'

export const longTouchDuration = 750

const Container = styled('div')({
  flex: 1,
})

type MapProps = {
  center: [number, number]
  zoom: number
  mapserverUrl: string
  onClick: MouseEventHandler
  onContextMenu: MouseEventHandler
  onRender: MapEventHandler
  onTouchEnd: TouchEventHandler
  onTouchStart: TouchEventHandler
  children: ReactNode
}

const Map: VFC<MapProps> = ({
  center,
  zoom,
  mapserverUrl,
  onClick,
  onContextMenu,
  onRender,
  onTouchEnd,
  onTouchStart,
  children,
}) => {
  const [map, setMap] = useState<MaplibreMap>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const maplibreMap = new MaplibreMap({
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
  }, [])

  return (
    <>
      <Container ref={containerRef} />
      {map && !map._removed && (
        <MapContextProvider value={map}>{children}</MapContextProvider>
      )}
    </>
  )
}

export default Map

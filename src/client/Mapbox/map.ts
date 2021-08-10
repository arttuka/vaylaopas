import { useCallback, useRef } from 'react'
import { Map } from 'maplibre-gl'
import { addLayers } from './layer'
import { addSources, useSource } from './source'
import { Sources } from './types'
import { addMapLoad } from '../api'
import { ClientConfig } from '../../common/types'

declare const clientConfig: ClientConfig
export const longTouchDuration = 750

type useMapProps = {
  onInit: (map: Map) => void
  center: [number, number]
  zoom: number
  sources: Sources
}

export const useMap = ({
  onInit,
  center,
  zoom,
  sources,
}: useMapProps): ((container: HTMLDivElement) => void) => {
  const mapRef = useRef<Map>()
  const setContainerRef = useCallback((container: HTMLDivElement | null) => {
    if (container == null) {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = undefined
      }
    } else if (mapRef.current === undefined) {
      const map = new Map({
        container,
        style: clientConfig.mapserver,
        hash: true,
        zoom,
        center,
        dragRotate: false,
      })
      map.on('load', (): void => {
        addSources(map, sources)
        addLayers(map)
        onInit(map)
        addMapLoad()
      })
      mapRef.current = map
    }
  }, [])

  for (const source of Object.values(sources)) {
    useSource(mapRef, source)
  }

  return setContainerRef
}
